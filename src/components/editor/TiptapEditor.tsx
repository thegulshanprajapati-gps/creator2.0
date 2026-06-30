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
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { GOOGLE_FONTS_LIST } from '@/lib/font-list';
import { useCMS } from '@/components/cms-provider';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link2, 
  Image as ImageIcon, Quote, Code, Table as TableIcon, Trash2, Undo2, Redo2, Palette, Highlighter,
  Maximize2, Minimize2, Eye, EyeOff
} from 'lucide-react';
import { ImagePicker } from '@/components/admin/image-picker';

// Custom TextStyle extension to support Font Size
const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize,
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
});

interface TiptapEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

const FONT_SIZES = [
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '30px', value: '30px' },
  { label: '36px', value: '36px' },
  { label: '48px', value: '48px' },
  { label: '60px', value: '60px' },
  { label: '72px', value: '72px' },
];

const PRESET_COLORS = [
  '#000000', '#4b5563', '#d1d5db', '#ffffff',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
];

const PRESET_HIGHLIGHTS = [
  'transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa', '#ddd6fe'
];

export default function TiptapEditor({ value, onChange, placeholder, className }: TiptapEditorProps) {
  const { customFonts } = useCMS();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  
  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Close color pickers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (highlightRef.current && !highlightRef.current.contains(event.target as Node)) {
        setShowHighlightPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allFontsList = [
    ...GOOGLE_FONTS_LIST,
    ...(customFonts || []).map((f: any) => f.name),
  ].filter((v, i, arr) => arr.indexOf(v) === i).sort((a, b) => a.localeCompare(b));

  const extensions = useMemo(() => [
    StarterKit.configure(),
    Underline.configure(),
    Color.configure(),
    CustomTextStyle,
    FontFamily.configure(),
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({ openOnClick: false }),
    Image.configure({ inline: true, allowBase64: true }),
    Table.configure({ resizable: true }),
    TableRow.configure(),
    TableHeader.configure(),
    TableCell.configure(),
  ], []);

  const editor = useEditor({
    extensions,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[260px] p-5 outline-none prose prose-sm sm:prose-base dark:prose-invert max-w-none cursor-text focus:outline-none focus:ring-0',
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
    setShowColorPicker(false);
  };

  const setHighlightColor = (color: string) => {
    if (color === 'transparent') {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
    setShowHighlightPicker(false);
  };

  const setFontSize = (size: string) => {
    if (size === 'default') {
      editor.chain().focus().setMark('textStyle', { fontSize: null }).run();
    } else {
      editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
    }
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
    <div className={cn(
      "flex flex-col border border-primary/10 bg-background shadow-sm overflow-hidden transition-all",
      isFullscreen ? "fixed inset-0 z-[9999] w-screen h-screen rounded-none" : "rounded-2xl focus-within:ring-2 focus-within:ring-primary/30",
      className
    )}>
      
      {/* Premium Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-primary/5 bg-muted/20 select-none">
        
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
          className="h-8 rounded-lg bg-background border border-primary/10 text-xs px-2 focus:outline-none max-w-[120px] font-bold text-foreground"
        >
          <option value="default">Default Font</option>
          {allFontsList.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>

        {/* Font Size Dropdown */}
        <select
          onChange={(e) => setFontSize(e.target.value)}
          value={editor.getAttributes('textStyle').fontSize || 'default'}
          className="h-8 rounded-lg bg-background border border-primary/10 text-xs px-2 focus:outline-none max-w-[90px] font-bold text-foreground"
        >
          <option value="default">Size</option>
          {FONT_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
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

        {/* Color / Highlight Picker Popovers */}
        <div className="flex items-center gap-0.5">
          {/* Text Color */}
          <div className="relative" ref={colorRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground", showColorPicker && "bg-primary/10 text-primary")}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Text Color"
            >
              <Palette className="h-4 w-4" />
            </Button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-xl shadow-xl z-50 grid grid-cols-5 gap-1 min-w-[120px]">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className="w-5 h-5 rounded-full border border-border transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                    onClick={() => setTextColor(color)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Highlight Color */}
          <div className="relative" ref={highlightRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground", showHighlightPicker && "bg-primary/10 text-primary")}
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              title="Highlight Color"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-xl shadow-xl z-50 grid grid-cols-4 gap-1 min-w-[100px]">
                {PRESET_HIGHLIGHTS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className="w-5 h-5 rounded border border-border transition-transform hover:scale-110 flex items-center justify-center text-[9px] font-bold"
                    style={{ backgroundColor: color === 'transparent' ? 'transparent' : color }}
                    onClick={() => setHighlightColor(color)}
                  >
                    {color === 'transparent' && '❌'}
                  </button>
                ))}
              </div>
            )}
          </div>
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

        <div className="flex-1" />

        {/* Right side utilities: Source view & Fullscreen */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground", showSource && "bg-primary/10 text-primary")}
          onClick={() => setShowSource(!showSource)}
          title={showSource ? "Show Rich Text" : "Show HTML Source"}
        >
          {showSource ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

      </div>

      {/* Editor Surface */}
      <div className={cn("flex-1 overflow-y-auto", isFullscreen ? "h-[calc(100vh-50px)]" : "max-h-[500px]")}>
        {showSource ? (
          <textarea
            className="w-full h-full min-h-[260px] p-5 font-mono text-sm bg-muted/10 text-foreground outline-none border-none resize-none focus:ring-0"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              editor.commands.setContent(e.target.value || '');
            }}
            placeholder="Write HTML code here..."
          />
        ) : (
          <EditorContent editor={editor} className="h-full" />
        )}
      </div>
    </div>
  );
}
