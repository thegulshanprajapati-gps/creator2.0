'use client';

import { useEffect, useState, useRef } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2, ArrowLeft, Loader2, BookOpen, Image as ImageIcon, Clock, Calendar } from "lucide-react";
import NextLink from 'next/link';

// Custom explorer items
import { ContextMenu } from "@/components/admin/context-menu";
import { AssetPreviewModal } from "@/components/admin/asset-preview-modal";
import { SelectionToolbar } from "@/components/admin/selection-toolbar";
import { DragSelectionLayer } from "@/components/admin/drag-selection";

// ─── Days Remaining Badge ─────────────────────────────────────────────────────
function DaysRemainingBadge({ days }: { days: number }) {
  const color =
    days <= 2
      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
      : days <= 5
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color} inline-flex items-center gap-1`}>
      <Clock className="h-2.5 w-2.5" />
      {days}d left
    </span>
  );
}

// ─── Blog Trash Tab ───────────────────────────────────────────────────────────
function BlogTrashTab() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchTrashedBlogs = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/blogs/trash');
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to load trashed blogs.');
        }
        const data = await res.json();
        setBlogs(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchTrashedBlogs();
  }, [refreshKey]);

  const handleRestore = async (blog: any) => {
    try {
      const res = await fetch('/api/blogs/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: blog.id }),
      });
      if (!res.ok) throw new Error('Restore failed.');
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert(String(e));
    }
  };

  const handlePermDelete = async (blog: any) => {
    if (!confirm(`Permanently delete "${blog.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/blogs/trash', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: blog.id }),
      });
      if (!res.ok) throw new Error('Permanent delete failed.');
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert(String(e));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground font-bold py-10 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading trashed blog posts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive font-medium">
        {error}
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground font-medium">
        <BookOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
        No blog posts in the recycle bin.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {blogs.map((blog) => (
        <div
          key={blog.id}
          className="flex items-start sm:items-center gap-4 p-4 rounded-2xl border border-border bg-background hover:border-amber-300/50 dark:hover:border-amber-700/50 transition-all duration-200"
        >
          {/* Thumbnail */}
          {blog.image && (
            <div className="shrink-0 h-14 w-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-border hidden sm:block">
              <img src={blog.image} alt={blog.title} className="h-full w-full object-cover opacity-70" />
            </div>
          )}

          {/* Info */}
          <div className="flex-grow min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{blog.title}</span>
              {blog.category && (
                <Badge className="bg-amber-500/10 text-amber-800 dark:text-yellow-400 border-none font-bold text-[9px] py-0.5 px-2">
                  {blog.category}
                </Badge>
              )}
              <DaysRemainingBadge days={blog.days_remaining ?? 10} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Deleted {blog.deleted_at ? new Date(blog.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </span>
              {blog.author && (
                <span>By {blog.author}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-bold border-emerald-200/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => handleRestore(blog)}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              onClick={() => handlePermDelete(blog)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function RecycleBinPage() {
  const [activeTab, setActiveTab] = useState<'images' | 'blogs'>('images');
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; asset: any } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastSelectedIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeTab !== 'images') return;
    const fetchRecycled = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/recycle-bin");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load recycled assets.");
        }
        setAssets(data.resources || []);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchRecycled();
  }, [refreshKey, activeTab]);

  // Keyboard binding shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          handlePermanentDeleteSelected();
        }
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedIds(assets.map((a) => a.public_id));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedIds([]);
        setPreviewAsset(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIds.length === 1) {
          const matched = assets.find((a) => a.public_id === selectedIds[0]);
          if (matched) setPreviewAsset(matched);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, assets]);

  // Selection modifier keys
  const handleItemClick = (e: React.MouseEvent, asset: any, index: number) => {
    const publicId = asset.public_id;
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;

    if (e.shiftKey && lastSelectedIndexRef.current !== null) {
      const start = Math.min(lastSelectedIndexRef.current, index);
      const end = Math.max(lastSelectedIndexRef.current, index);
      const sliceIds = assets.slice(start, end + 1).map((a) => a.public_id);
      setSelectedIds((prev) => {
        const union = new Set([...prev, ...sliceIds]);
        return Array.from(union);
      });
    } else if (isModifierPressed) {
      setSelectedIds((prev) => {
        if (prev.includes(publicId)) {
          return prev.filter((id) => id !== publicId);
        } else {
          return [...prev, publicId];
        }
      });
      lastSelectedIndexRef.current = index;
    } else {
      setSelectedIds([publicId]);
      lastSelectedIndexRef.current = index;
    }
  };

  const handleDragSelectionChange = (indexes: number[]) => {
    const ids = indexes.map((idx) => assets[idx]?.public_id).filter(Boolean);
    setSelectedIds(ids);
  };

  const handleDoubleClick = (asset: any) => {
    setPreviewAsset(asset);
  };

  const handleContextMenu = (e: React.MouseEvent, asset: any) => {
    e.preventDefault();
    if (!selectedIds.includes(asset.public_id)) {
      setSelectedIds([asset.public_id]);
    }
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      asset,
    });
  };

  const handleRestoreSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_ids: selectedIds }),
      });
      if (!res.ok) throw new Error('Restore operation failed.');
      setSelectedIds([]);
      setPreviewAsset(null);
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      alert(String(e));
    }
  };

  const handleRestoreSingle = async (asset: any) => {
    try {
      const res = await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_ids: [asset.public_id] }),
      });
      if (!res.ok) throw new Error('Restore operation failed.');
      setSelectedIds([]);
      setPreviewAsset(null);
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      alert(String(e));
    }
  };

  const handlePermanentDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm('Are you sure you want to permanently delete the selected assets? This cannot be undone.')) return;

    try {
      const res = await fetch('/api/recycle-bin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_ids: selectedIds }),
      });
      if (!res.ok) throw new Error('Permanent delete operation failed.');
      setSelectedIds([]);
      setPreviewAsset(null);
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      alert(String(e));
    }
  };

  const handlePermanentDeleteSingle = async (asset: any) => {
    if (!confirm(`Are you sure you want to permanently delete ${asset.public_id}? This cannot be undone.`)) return;

    try {
      const res = await fetch('/api/recycle-bin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_ids: [asset.public_id] }),
      });
      if (!res.ok) throw new Error('Permanent delete operation failed.');
      setSelectedIds([]);
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
            <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" asChild>
              <NextLink href="/assets">
                <ArrowLeft className="h-5 w-5" />
              </NextLink>
            </Button>
            <div>
              <h1 className="text-3xl font-headline font-bold text-rose-600 dark:text-rose-500">Recycle Bin</h1>
              <p className="text-muted-foreground">Restore soft-deleted files or purge them permanently.</p>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto space-y-6">

          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('images')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'images'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="h-4 w-4" /> Images
            </button>
            <button
              onClick={() => setActiveTab('blogs')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'blogs'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="h-4 w-4" /> Blog Posts
            </button>
          </div>

          {/* Images Tab */}
          {activeTab === 'images' && (
            <Card className="border-primary/10 shadow-lg relative overflow-hidden" ref={containerRef}>
              <DragSelectionLayer
                containerRef={containerRef}
                itemsCount={assets.length}
                selector=".recycled-card"
                onSelectionChange={handleDragSelectionChange}
              />

              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-amber-900 dark:text-yellow-400">Recycled Files</CardTitle>
                  <CardDescription>Click + drag select or use right-click to restore/purge items.</CardDescription>
                </div>
                {selectedIds.length > 0 && (
                  <Button variant="ghost" onClick={() => setSelectedIds([])} className="text-sm font-bold text-amber-800 dark:text-yellow-400">
                    Deselect All
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {loading && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground font-bold">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading recycled repository...
                  </div>
                )}
                {error && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive font-medium">
                    {error}
                  </div>
                )}
                {!loading && !error && assets.length === 0 && (
                  <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground font-medium">
                    Recycle bin is empty. Soft-deleted assets will appear here.
                  </div>
                )}
                {!loading && assets.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 select-none">
                    {assets.map((asset, index) => {
                      const isSelected = selectedIds.includes(asset.public_id);
                      return (
                        <div
                          key={asset.public_id}
                          onMouseDown={(e) => handleItemClick(e, asset, index)}
                          onDoubleClick={() => handleDoubleClick(asset)}
                          onContextMenu={(e) => handleContextMenu(e, asset)}
                          className={`recycled-card relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 dark:border-yellow-400 dark:bg-yellow-400/5"
                              : "border-border hover:border-amber-500/40 dark:hover:border-yellow-400/30"
                          }`}
                        >
                          <div className="absolute top-2 left-2 z-10">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedIds((prev) =>
                                  prev.includes(asset.public_id)
                                    ? prev.filter((id) => id !== asset.public_id)
                                    : [...prev, asset.public_id]
                                );
                              }}
                              className="h-4.5 w-4.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500/30 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer"
                            />
                          </div>

                          <div className="aspect-square w-full bg-slate-100 dark:bg-zinc-900 relative">
                            <img
                              src={asset.secure_url || asset.original_path}
                              alt={asset.public_id}
                              className="h-full w-full object-cover pointer-events-none opacity-60"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-4 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
                            <div className="font-bold text-sm truncate text-slate-800 dark:text-zinc-200">
                              {asset.public_id.split('/').pop()}
                            </div>
                            <div className="text-xs font-semibold text-muted-foreground mt-1">
                              Deleted at: {new Date(asset.deleted_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Blog Posts Tab */}
          {activeTab === 'blogs' && (
            <Card className="border-primary/10 shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-amber-900 dark:text-yellow-400 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-amber-500" /> Trashed Blog Posts
                </CardTitle>
                <CardDescription>Restore posts within 10 days or permanently delete them.</CardDescription>
              </CardHeader>
              <CardContent>
                <BlogTrashTab />
              </CardContent>
            </Card>
          )}
        </main>

        {/* Selection toolbar only shows for images tab */}
        {activeTab === 'images' && (
          <SelectionToolbar
            selectedCount={selectedIds.length}
            onClear={() => setSelectedIds([])}
            onRestore={handleRestoreSelected}
            onDelete={handlePermanentDeleteSelected}
            isRecycleBin={true}
          />
        )}

        <AssetPreviewModal
          asset={previewAsset}
          isOpen={!!previewAsset}
          onClose={() => setPreviewAsset(null)}
          onRestore={handleRestoreSingle}
          onDelete={handlePermanentDeleteSingle}
          isRecycleBin={true}
        />

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            options={[
              { label: 'Open Preview', onClick: () => setPreviewAsset(contextMenu.asset) },
              { label: 'Restore File', onClick: () => handleRestoreSingle(contextMenu.asset) },
              { label: 'Delete Permanently', onClick: () => handlePermanentDeleteSingle(contextMenu.asset), className: 'text-rose-600' },
            ]}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
