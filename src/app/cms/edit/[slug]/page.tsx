"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/rich-text-editor";
import { useCmsPage } from "@/hooks/use-cms-page";

export default function CmsEditPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : (Array.isArray(params?.slug) ? params.slug[0] : undefined);
  const router = useRouter();
  const { page, loading, error, save, reload } = useCmsPage(slug);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');

  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setContentHtml(typeof page.content === 'string' ? page.content : (page.content?.html || ''));
    }
  }, [page]);

  const handleSave = async () => {
    try {
      await save({ title, content: { html: contentHtml } });
      toast({ title: 'Saved', description: 'Page saved successfully.' });
      reload();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: err?.message || String(err) });
    }
  };

  if (!slug) return <div className="p-8">Missing page slug</div>;

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <main className="p-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-headline font-bold">Edit Page — {slug}</h1>
              <p className="text-sm text-muted-foreground">Universal CMS editor (slug-aware)</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => router.back()} variant="ghost">Back</Button>
              <Button onClick={handleSave} disabled={loading}>Save</Button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <Label>Content</Label>
              <RichTextEditor value={contentHtml} onChange={setContentHtml} placeholder="Write page content..." />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
