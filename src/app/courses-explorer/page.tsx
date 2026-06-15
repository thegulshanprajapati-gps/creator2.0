'use client';

import { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { FolderExplorer } from "@/components/folder-explorer";
import { useFolderExplorer } from "@/hooks/use-folder-explorer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CoursesExplorerPage() {
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const explorer = useFolderExplorer("default");

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div>
            <h1 className="font-headline font-bold text-xl">Curriculum Catalog</h1>
            <p className="text-xs text-muted-foreground">Manage courses with file explorer interface.</p>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* File Explorer Sidebar */}
            <div className="lg:col-span-1">
              <FolderExplorer
                tree={explorer.tree}
                expandedFolders={explorer.expandedFolders}
                onToggleExpand={explorer.toggleExpand}
                onCreateFolder={explorer.createFolder}
                onRenameFolder={explorer.renameFolder}
                onDeleteFolder={explorer.deleteFolder}
                onSelectFolder={setSelectedFolder}
              />
            </div>

            {/* Content Panel */}
            <div className="lg:col-span-3">
              {selectedFolder ? (
                <Card className="border-primary/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">{selectedFolder.name}</CardTitle>
                    <CardDescription>Folder content and metadata</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Folder ID</label>
                      <div className="p-3 bg-muted rounded-md text-sm font-mono">{selectedFolder.id}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Module</label>
                      <div className="p-3 bg-muted rounded-md text-sm">{selectedFolder.module}</div>
                    </div>
                    {selectedFolder.is_paid !== undefined && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Pricing</label>
                        <div className="p-3 bg-muted rounded-md text-sm">
                          {selectedFolder.is_paid ? "💰 Paid Course" : "🎓 Free Course"}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground pt-4">
                      Subcategories: {selectedFolder.children?.length || 0}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <p>Select a folder from the explorer to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
