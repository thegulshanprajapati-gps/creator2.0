'use client';

import { Editor } from '@tinymce/tinymce-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { GOOGLE_FONTS_LIST } from '@/lib/font-list';
import { useCMS } from '@/components/cms-provider';

interface TinyMCEEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TinyMCEEditor({ value, onChange, placeholder, className }: TinyMCEEditorProps) {
  const { customFonts } = useCMS();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || 'pqssm8ctj174zbor7gv0bdz1solj7nmbugzttwfj2n6287z1';

  useEffect(() => {
    // Detect system theme
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    
    // Listen for changes
    const observer = new MutationObserver(() => {
      const darkActive = document.documentElement.classList.contains('dark');
      setTheme(darkActive ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Abel&family=Abril+Fatface&family=Alfa+Slab+One&family=Alice&family=Amatic+SC&family=Anonymous+Pro&family=Archivo+Black&family=Arimo&family=Arizonia&family=Arvo&family=Asap&family=Assistant&family=Barlow&family=Bitter&family=Bree+Serif&family=Bricolage+Grotesque&family=Bungee&family=Cabin&family=Cardo&family=Caveat&family=Chivo&family=Cinzel&family=Comfortaa&family=Cormorant+Garamond&family=Courgette&family=Courier+Prime&family=Crimson+Text&family=Dancing+Script&family=DM+Sans&family=DM+Serif+Display&family=Domine&family=Dosis&family=EB+Garamond&family=Exo+2&family=Fira+Code&family=Fira+Sans&family=Fredoka&family=Garamond&family=Geist&family=Georgia&family=Gloria+Hallelujah&family=Gochi+Hand&family=Great+Vibes&family=Heebo&family=Hind&family=IBM+Plex+Mono&family=IBM+Plex+Sans&family=Inconsolata&family=Indie+Flower&family=Inter&family=JetBrains+Mono&family=Josefin+Sans&family=Kanit&family=Karla&family=Kaushan+Script&family=Lato&family=League+Script&family=Lexend&family=Libre+Baskerville&family=Libre+Franklin&family=Lobster&family=Lora&family=Lustria&family=Manrope&family=Maven+Pro&family=Merriweather&family=Montserrat&family=Mukta&family=Neuton&family=Noto+Sans&family=Noto+Serif&family=Nunito&family=Open+Sans&family=Oswald&family=Outfit&family=Overpass&family=Pacifico&family=Parisienne&family=Permanent+Marker&family=Playfair+Display&family=Plus+Jakarta+Sans&family=Poppins&family=Press+Start+2P&family=Quicksand&family=Raleway&family=Righteous&family=Roboto&family=Roboto+Mono&family=Sacramento&family=Satisfy&family=Space+Grotesk&family=Special+Elite&family=Spectral&family=Tangerine&family=Titan+One&family=Ubuntu&family=Urbanist&family=Varela+Round&family=Work+Sans&family=Yellowtail&family=Yeseva+One&display=swap';

  const allFontsList = [
    ...GOOGLE_FONTS_LIST,
    ...(customFonts || []).map((f: any) => f.name),
  ].sort((a, b) => a.localeCompare(b));

  const fontFormats = allFontsList.map(font => `${font}=${font}`).join('; ');

  return (
    <div className={cn("border border-primary/10 rounded-2xl overflow-hidden bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/30 transition-all", className)}>
      <Editor
        apiKey={apiKey}
        value={value}
        onEditorChange={(content) => onChange(content)}
        init={{
          height: 320,
          autoresize_min_height: 260,
          autoresize_max_height: 600,
          toolbar_mode: 'sliding',
          menubar: 'insert format table tools help',
          placeholder: placeholder || 'Start writing here...',
          plugins: [
            // Free plugins baseline
            'accordion', 'advlist', 'anchor', 'autolink', 'autoresize', 'autosave',
            'charmap', 'code', 'codesample', 'directionality', 'emoticons', 'fullscreen',
            'help', 'image', 'importcss', 'insertdatetime', 'link', 'lists', 'media',
            'nonbreaking', 'pagebreak', 'preview', 'quickbars', 'save', 'searchreplace',
            'table', 'visualblocks', 'visualchars', 'wordcount'
          ],
          toolbar: 'undo redo | blocks fontfamily | ' +
            'bold italic underline strikethrough forecolor backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'table image link media | removeformat code | fullscreen',
          content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px }',
          font_family_formats: fontFormats,
          skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
          content_css: [
            theme === 'dark' ? 'dark' : 'default', 
            googleFontsUrl,
            ...(customFonts || []).map((f: any) => `http://localhost:3000/fonts/${f.file_name}`)
          ],
          importcss_append: true,
          style_formats_merge: true,
          style_formats: [
            { title: 'Headers', items: [
              { title: 'h1', block: 'h1' },
              { title: 'h2', block: 'h2' },
              { title: 'h3', block: 'h3' }
            ]}
          ],
          branding: false,
          statusbar: true,
          setup: (editor: any) => {
            editor.on('init', () => {
              editor.getContainer().style.transition = 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out';
            });
          }
        }}
      />
    </div>
  );
}
