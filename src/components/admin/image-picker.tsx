'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Image as ImageIcon, Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ImagePickerProps {
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
}

export function ImagePicker({ onSelect, trigger }: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      fetchAssets();
    }
  }, [open]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cloudinary-assets");
      const data = await res.json();
      if (res.ok) {
        setAssets(data.resources || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset => 
    asset.public_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="rounded-xl">
            <ImageIcon className="mr-2 h-4 w-4" /> Pick from Library
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col rounded-[2rem] p-0 overflow-hidden border-primary/10">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <DialogTitle className="text-2xl font-headline flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>
            Asset Library Picker
          </DialogTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search assets by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-border bg-background"
            />
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
            </div>
          ) : filteredAssets.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map(asset => {
                const url = (asset.secure_url || '').toLowerCase();
                const isPdf = url.endsWith('.pdf') || asset.format === 'pdf';
                
                return (
                  <div 
                    key={asset.public_id} 
                    className="group relative rounded-2xl overflow-hidden border border-border cursor-pointer hover:border-primary transition-all shadow-sm hover:shadow-md bg-muted/10"
                    onClick={() => {
                      onSelect(asset.secure_url);
                      setOpen(false);
                    }}
                  >
                    {isPdf ? (
                      <div className="h-32 w-full flex flex-col items-center justify-center gap-2 bg-rose-500/5 text-rose-500 border-b">
                        <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center shadow-sm">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="text-[9px] uppercase font-black tracking-widest opacity-60">PDF Document</span>
                      </div>
                    ) : (
                      <img src={asset.secure_url} alt={asset.public_id} className="h-32 w-full object-cover transition-transform group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <Button size="sm" variant="secondary" className="rounded-xl pointer-events-none font-bold">Select</Button>
                    </div>
                    <div className="p-3 bg-background border-t text-xs truncate font-medium">
                      {asset.public_id.split('/').pop()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl">
              <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
              <p>No assets found.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
