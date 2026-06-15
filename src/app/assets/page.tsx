'use client';

import { useEffect, useState, useMemo } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import NextLink from 'next/link';
import { WindowsExplorer, ExplorerItem } from "@/components/admin/windows-explorer";
import { AssetPreviewModal } from "@/components/admin/asset-preview-modal";

export default function AssetsPage() {
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);
  const galleryUrl = process.env.NEXT_PUBLIC_CLOUDINARY_GALLERY_URL || process.env.NEXT_PUBLIC_CLOUDINARY_URL || "";

  useEffect(() => {
    const fetchAssets = async () => {
      if (!galleryUrl) {
        setError("Cloudinary gallery URL is not configured.");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/cloudinary-assets");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load assets.");
        }
        setAssets(data.resources || []);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [galleryUrl, refreshKey]);

  // Parse Cloudinary Assets to Windows Explorer items
  const explorerItems = useMemo<ExplorerItem[]>(() => {
    const itemsList: ExplorerItem[] = [];
    const foldersSet = new Set<string>();

    assets.forEach((asset) => {
      const parts = asset.public_id.split('/');
      const fileName = parts.pop() || asset.public_id;
      
      let currentPath = '';
      parts.forEach((part: string) => {
        const parentPath = currentPath || null;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!foldersSet.has(currentPath)) {
          foldersSet.add(currentPath);
          itemsList.push({
            id: `folder_${currentPath}`,
            name: part,
            type: 'folder' as const,
            parentId: parentPath ? `folder_${parentPath}` : null,
          });
        }
      });

      const parentFolderId = currentPath ? `folder_${currentPath}` : null;
      itemsList.push({
        id: asset.public_id,
        name: fileName,
        type: 'file' as const,
        parentId: parentFolderId,
        size: asset.bytes,
        url: asset.secure_url,
        thumbnailUrl: asset.secure_url,
      });
    });

    return itemsList;
  }, [assets]);

  const handleCreateFolder = async (name: string, description: string, isPaid: boolean, parentId: string | null) => {
    // Creating folders virtually in Cloudinary upload is not directly supported via a simple post,
    // so we alert or create a dummy path.
    alert("Creating empty directories on Cloudinary directly is not supported. Please upload an asset inside the folder structure instead.");
  };

  const handleRenameItem = async (id: string, isFolder: boolean, newName: string) => {
    alert("Renaming Cloudinary files directly is not supported in this view.");
  };

  const handleDeleteItems = async (folderIds: string[], fileIds: string[]) => {
    // Find files directly selected plus files inside the virtual folders being deleted
    const targets = assets.filter((asset) => {
      if (fileIds.includes(asset.public_id)) return true;
      return folderIds.some((fId) => {
        const virtualFolder = fId.replace('folder_', '');
        return asset.public_id.startsWith(virtualFolder + '/');
      });
    });

    if (targets.length === 0) return;

    try {
      const res = await fetch('/api/cloudinary-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: targets }),
      });
      if (!res.ok) throw new Error('Recycle operation failed.');
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      alert(String(e));
    }
  };

  const handleUploadFile = async (file: File, parentFolderId: string | null) => {
    setLoading(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      
      const response = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body: uploadForm,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Cloudinary upload failed.');
      }
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleItemDoubleClick = (item: ExplorerItem) => {
    if (item.type === 'file') {
      const matched = assets.find((a) => a.public_id === item.id);
      if (matched) setPreviewAsset(matched);
    }
  };

  const handleRecycleSingle = async (asset: any) => {
    try {
      const res = await fetch('/api/cloudinary-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: [asset] }),
      });
      if (!res.ok) throw new Error('Recycle operation failed.');
      setPreviewAsset(null);
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      alert(String(e));
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-headline font-bold">Asset Library</h1>
              <p className="text-xs text-muted-foreground">View and manage Cloudinary image assets for your main site.</p>
            </div>
          </div>
          <Button variant="outline" className="font-bold rounded-xl h-11 border-rose-500/30 text-rose-600 hover:bg-rose-500/10" asChild>
            <NextLink href="/recycle-bin">
              <Trash2 className="mr-2 h-4.5 w-4.5" /> Recycle Bin
            </NextLink>
          </Button>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive font-medium">
              {error}
            </div>
          )}
          
          <Card className="border-primary/10 shadow-lg p-6">
            <WindowsExplorer
              items={explorerItems}
              title="Asset Library"
              rootName="Assets"
              onCreateFolder={handleCreateFolder}
              onRenameItem={handleRenameItem}
              onDeleteItems={handleDeleteItems}
              onUploadFile={handleUploadFile}
              onItemDoubleClick={handleItemDoubleClick}
              showAccessSelector={false}
            />
          </Card>
        </main>

        <AssetPreviewModal
          asset={previewAsset}
          isOpen={!!previewAsset}
          onClose={() => setPreviewAsset(null)}
          onDelete={handleRecycleSingle}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
