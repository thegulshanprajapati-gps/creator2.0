'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Trash2, RotateCcw, Copy, ExternalLink } from 'lucide-react';

interface AssetPreviewModalProps {
  asset: any;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (asset: any) => void;
  onRestore?: (asset: any) => void;
  isRecycleBin?: boolean;
}

export function AssetPreviewModal({
  asset,
  isOpen,
  onClose,
  onDelete,
  onRestore,
  isRecycleBin = false,
}: AssetPreviewModalProps) {
  if (!asset) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(asset.secure_url || asset.original_path);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(asset.secure_url || asset.original_path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = asset.public_id.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(asset.secure_url || asset.original_path, '_blank');
    }
  };

  const formattedSize = asset.bytes ? `${Math.round(asset.bytes / 1024)} KB` : 'Unknown size';
  const uploadDate = asset.created_at || asset.deleted_at 
    ? new Date(asset.created_at || asset.deleted_at).toLocaleDateString()
    : 'Unknown date';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl overflow-hidden rounded-3xl border border-amber-200/50 bg-white/95 dark:border-amber-500/20 dark:bg-zinc-950/95 shadow-2xl backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline font-bold text-amber-900 dark:text-yellow-400 truncate">
            {asset.public_id}
          </DialogTitle>
          <DialogDescription className="text-xs text-amber-700 dark:text-amber-500">
            {uploadDate} • {formattedSize}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="md:col-span-2 flex items-center justify-center bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl overflow-hidden min-h-[300px] max-h-[500px]">
            <img
              src={asset.secure_url || asset.original_path}
              alt={asset.public_id}
              className="object-contain max-h-[480px] w-full"
            />
          </div>

          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-500">Format</h4>
                <p className="text-sm font-semibold">{String(asset.format || 'PNG/JPG').toUpperCase()}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-500">Cloudinary Path</h4>
                <p className="text-xs font-mono break-all bg-amber-50/50 dark:bg-amber-950/10 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
                  {asset.public_id}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleCopyUrl} variant="outline" className="w-full font-bold h-11 rounded-xl">
                <Copy className="mr-2 h-4 w-4" /> Copy URL
              </Button>

              <Button onClick={handleDownload} variant="outline" className="w-full font-bold h-11 rounded-xl">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>

              {isRecycleBin ? (
                <>
                  {onRestore && (
                    <Button onClick={() => onRestore(asset)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-11 rounded-xl">
                      <RotateCcw className="mr-2 h-4 w-4" /> Restore File
                    </Button>
                  )}
                  {onDelete && (
                    <Button onClick={() => onDelete(asset)} variant="destructive" className="w-full font-bold h-11 rounded-xl">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                    </Button>
                  )}
                </>
              ) : (
                onDelete && (
                  <Button onClick={() => onDelete(asset)} variant="destructive" className="w-full font-bold h-11 rounded-xl">
                    <Trash2 className="mr-2 h-4 w-4" /> Move to Recycle Bin
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
