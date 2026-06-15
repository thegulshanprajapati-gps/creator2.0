'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { GOOGLE_FONTS_LIST } from '@/lib/font-list';
import { useCMS } from '@/components/cms-provider';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link2, 
  Image as ImageIcon, Quote, Code, Table as TableIcon, Trash2, Undo2, Redo2, Palette, Highlighter
} from 'lucide-react';
import { ImagePicker } from '@/components/admin/image-picker';

interface TiptapEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TiptapEditor({ value, onChange, placeholder, className }: TiptapEditorProps) {
  const { customFonts } = useCMS();
  const allFontsList = [
    ...GOOGLE_FONTS_LIST,
    ...(customFonts || []).map((f: any) => f.name),
  ].sort((a, b) => a.localeCompare(b));

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Color,
      TextStyle,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: true, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[220px] p-5 outline-none prose prose-sm sm:prose-base dark:prose-invert max-w-none cursor-text focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) return <div className="h-60 bg-muted/10 animate-pulse rounded-2xl border border-primary/5" />;

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl);
    
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const setTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const setHighlightColor = (color: string) => {
    editor.chain().focus().setHighlight({ color }).run();
  };

  const active = (name: string, attrs = {}) => editor.isActive(name, attrs);

  const ToolButton = ({ icon: Icon, onClick, activeName, activeAttrs, title }: any) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground",
        activeName && active(activeName, activeAttrs) && "bg-primary/10 text-primary"
      )}
      onClick={(e) => { e.preventDefault(); onClick(); }}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn("flex flex-col border border-primary/10 rounded-2xl bg-background shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 transition-all", className)}>
      
      {/* Premium Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-primary/5 bg-muted/20 select-none">
        
        {/* History */}
        <ToolButton icon={Undo2} onClick={() => editor.chain().focus().undo().run()} title="Undo" />
        <ToolButton icon={Redo2} onClick={() => editor.chain().focus().redo().run()} title="Redo" />
        
        <div className="w-px h-5 bg-border mx-1" />

        {/* Font Family Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value === 'default') {
              editor.chain().focus().unsetFontFamily().run();
            } else {
              editor.chain().focus().setFontFamily(e.target.value).run();
            }
          }}
          value={editor.getAttributes('textStyle').fontFamily || 'default'}
          className="h-8 rounded-lg bg-background border border-primary/10 text-xs px-2 focus:outline-none max-w-[130px] font-bold text-foreground mr-1"
        >
          <option value="default">Default Font</option>
          {allFontsList.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Formats */}
        <ToolButton icon={Bold} onClick={() => editor.chain().focus().toggleBold().run()} activeName="bold" title="Bold" />
        <ToolButton icon={Italic} onClick={() => editor.chain().focus().toggleItalic().run()} activeName="italic" title="Italic" />
        <ToolButton icon={UnderlineIcon} onClick={() => editor.chain().focus().toggleUnderline().run()} activeName="underline" title="Underline" />
        <ToolButton icon={Strikethrough} onClick={() => editor.chain().focus().toggleStrike().run()} activeName="strike" title="Strikethrough" />

        <div className="w-px h-5 bg-border mx-1" />

        {/* Headings */}
        <ToolButton icon={Heading1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} activeName="heading" activeAttrs={{ level: 1 }} title="Heading 1" />
        <ToolButton icon={Heading2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} activeName="heading" activeAttrs={{ level: 2 }} title="Heading 2" />
        <ToolButton icon={Heading3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} activeName="heading" activeAttrs={{ level: 3 }} title="Heading 3" />

        <div className="w-px h-5 bg-border mx-1" />

        {/* Text Alignment */}
        <ToolButton icon={AlignLeft} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left" />
        <ToolButton icon={AlignCenter} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center" />
        <ToolButton icon={AlignRight} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right" />
        <ToolButton icon={AlignJustify} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justify" />

        <div className="w-px h-5 bg-border mx-1" />

        {/* Lists & Quotes */}
        <ToolButton icon={List} onClick={() => editor.chain().focus().toggleBulletList().run()} activeName="bulletList" title="Bullet List" />
        <ToolButton icon={ListOrdered} onClick={() => editor.chain().focus().toggleOrderedList().run()} activeName="orderedList" title="Numbered List" />
        <ToolButton icon={Quote} onClick={() => editor.chain().focus().toggleBlockquote().run()} activeName="blockquote" title="Blockquote" />
        <ToolButton icon={Code} onClick={() => editor.chain().focus().toggleCodeBlock().run()} activeName="codeBlock" title="Code Block" />

        <div className="w-px h-5 bg-border mx-1" />

        {/* Color / Highlight */}
        <div className="relative flex items-center">
          <label className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer relative" title="Text Color">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <input type="color" onChange={(e) => setTextColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          </label>
          <label className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer relative" title="Highlight Color">
            <Highlighter className="h-4 w-4 text-muted-foreground" />
            <input type="color" onChange={(e) => setHighlightColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          </label>
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Media & Table */}
        <ToolButton icon={Link2} onClick={toggleLink} activeName="link" title="Insert Link" />
        <ImagePicker 
          onSelect={(url) => editor.chain().focus().setImage({ src: url }).run()}
          trigger={
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground" title="Insert Image from Cloudinary">
              <ImageIcon className="h-4 w-4" />
            </Button>
          }
        />
        <ToolButton icon={TableIcon} onClick={addTable} activeName="table" title="Insert Table" />

        {/* Table Controls (Visible when inside a Table) */}
        {active('table') && (
          <div className="flex items-center gap-0.5 bg-primary/5 rounded-lg p-0.5 ml-1 border border-primary/10 animate-in fade-in zoom-in-95 duration-200">
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().addColumnBefore().run()} className="text-[10px] h-6 px-1.5">+ Col L</Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().addColumnAfter().run()} className="text-[10px] h-6 px-1.5">+ Col R</Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteColumn().run()} className="text-[10px] h-6 px-1.5 text-rose-500">- Col</Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().addRowBefore().run()} className="text-[10px] h-6 px-1.5">+ Row A</Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().addRowAfter().run()} className="text-[10px] h-6 px-1.5">+ Row B</Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteRow().run()} className="text-[10px] h-6 px-1.5 text-rose-500">- Row</Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteTable().run()} className="text-[10px] h-6 px-1.5 text-rose-500 font-bold">Delete Tab</Button>
          </div>
        )}

        <div className="w-px h-5 bg-border mx-1" />

        {/* Reset / Cleanup */}
        <ToolButton icon={Trash2} onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Clear Formatting" />
      </div>

      {/* Editor Surface */}
      <EditorContent editor={editor} />
    </div>
  );
}
