"use client";

import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/db";
import { toast } from "@/hooks/use-toast";

export type FolderNode = {
  id: string;
  name: string;
  type: "folder" | "content";
  parent_id: string | null;
  module: string;
  is_paid?: boolean;
  children?: FolderNode[];
  expanded?: boolean;
};

export function useFolderExplorer(module: string = "default") {
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from("course_folders")
        .select("id,title,parent_folder_id,module,is_paid,sort_order")
        .eq("module", module)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      interface RawFolder {
        id: string;
        title: string;
        parent_folder_id: string | null;
        module: string;
        is_paid?: boolean;
        sort_order?: number;
      }
      const folders = (data || []) as RawFolder[];
      const buildTree = (parentId: string | null): FolderNode[] => {
        return folders
          .filter((f) => f.parent_folder_id === parentId)
          .map((f) => ({
            id: f.id,
            name: f.title,
            type: "folder",
            parent_id: f.parent_folder_id,
            module: f.module,
            is_paid: f.is_paid,
            expanded: expandedFolders.has(f.id),
            children: buildTree(f.id),
          }));
      };

      const tree = buildTree(null);
      setTree(tree);
    } catch (err: any) {
      toast({ variant: "destructive", description: err?.message });
    } finally {
      setLoading(false);
    }
  }, [module, expandedFolders]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const createFolder = useCallback(
    async (name: string, parentId: string | null = null) => {
      try {
        const { data, error } = await db
          .from("course_folders")
          .insert([{ title: name, parent_folder_id: parentId, module }])
          .select();
        if (error) throw error;
        toast({ title: "Folder created" });
        loadTree();
        return data?.[0];
      } catch (err: any) {
        toast({ variant: "destructive", description: err?.message });
      }
    },
    [module, loadTree]
  );

  const renameFolder = useCallback(
    async (folderId: string, newName: string) => {
      try {
        const { error } = await db
          .from("course_folders")
          .update({ title: newName })
          .eq("id", folderId);
        if (error) throw error;
        toast({ title: "Renamed" });
        loadTree();
      } catch (err: any) {
        toast({ variant: "destructive", description: err?.message });
      }
    },
    [loadTree]
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      try {
        const { error } = await db.from("course_folders").delete().eq("id", folderId);
        if (error) throw error;
        toast({ title: "Deleted" });
        loadTree();
      } catch (err: any) {
        toast({ variant: "destructive", description: err?.message });
      }
    },
    [loadTree]
  );

  const toggleExpand = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) newExpanded.delete(folderId);
    else newExpanded.add(folderId);
    setExpandedFolders(newExpanded);
  };

  return { tree, loading, expandedFolders, loadTree, createFolder, renameFolder, deleteFolder, toggleExpand };
}
