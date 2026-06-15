"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Folder, Plus, MoreVertical, Trash2, Edit2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FolderNode } from "@/hooks/use-folder-explorer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface FolderExplorerProps {
  tree: FolderNode[];
  expandedFolders: Set<string>;
  onToggleExpand: (folderId: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => Promise<any>;
  onRenameFolder: (folderId: string, newName: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onSelectFolder?: (folder: FolderNode) => void;
}

export function FolderExplorer({
  tree,
  expandedFolders,
  onToggleExpand,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onSelectFolder,
}: FolderExplorerProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [creatingParentId, setCreatingParentId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  const handleRenameClick = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const handleRenameSubmit = async (id: string) => {
    if (renameValue.trim()) {
      await onRenameFolder(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const handleCreateFolder = async (parentId: string | null) => {
    if (newFolderName.trim()) {
      await onCreateFolder(newFolderName.trim(), parentId);
      setNewFolderName("");
      setCreatingParentId(null);
    }
  };

  const renderFolder = (node: FolderNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded-md group"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {/* Expand/Collapse Arrow */}
          {hasChildren ? (
            <button
              onClick={() => onToggleExpand(node.id)}
              className="p-0.5 hover:bg-muted-foreground/10 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Folder Icon */}
          <Folder className="h-4 w-4 text-primary flex-shrink-0" />

          {/* Folder Name */}
          {renamingId === node.id ? (
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => handleRenameSubmit(node.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit(node.id);
                if (e.key === "Escape") setRenamingId(null);
              }}
              className="h-6 px-2 text-sm"
            />
          ) : (
            <span
              onClick={() => onSelectFolder?.(node)}
              className="flex-1 text-sm cursor-pointer hover:text-primary transition-colors"
            >
              {node.name}
            </span>
          )}

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/10 rounded transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleRenameClick(node.id, node.name)}>
                <Edit2 className="mr-2 h-4 w-4" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreatingParentId(node.id)}>
                <Plus className="mr-2 h-4 w-4" /> New Subfolder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteFolder(node.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* New Subfolder Input */}
        {creatingParentId === node.id && (
          <div
            className="flex items-center gap-1 px-2 py-1"
            style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
          >
            <div className="w-5" />
            <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              autoFocus
              placeholder="New folder..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => handleCreateFolder(node.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder(node.id);
                if (e.key === "Escape") setCreatingParentId(null);
              }}
              className="h-6 px-2 text-sm"
            />
          </div>
        )}

        {/* Render Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Folder Structure</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCreatingParentId(null)}
          className="h-7"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> New Folder
        </Button>
      </div>

      {/* Root Level Create Input */}
      {creatingParentId === null && (
        <div className="flex items-center gap-1 px-2 py-1">
          <div className="w-5" />
          <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            autoFocus
            placeholder="New folder..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => handleCreateFolder(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder(null);
              if (e.key === "Escape") {
                setCreatingParentId(null);
                setNewFolderName("");
              }
            }}
            className="h-6 px-2 text-sm"
          />
        </div>
      )}

      {/* Tree Rendering */}
      <div className="max-h-96 overflow-y-auto">
        {tree.length === 0 ? (
          <div className="text-xs text-muted-foreground p-4 text-center">No folders yet</div>
        ) : (
          tree.map((folder) => renderFolder(folder))
        )}
      </div>
    </div>
  );
}
