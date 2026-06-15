"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  Folder, 
  File, 
  Trash2, 
  Edit2, 
  Plus, 
  Upload, 
  ChevronUp, 
  HardDrive, 
  Computer, 
  FolderSymlink, 
  X,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ContextMenu } from "@/components/admin/context-menu";
import { ImagePicker } from "@/components/admin/image-picker";
import { db } from "@/lib/db";

// Windows-style folder icon
export function WindowsFolderIcon({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back flap */}
      <path d="M4 10C4 7.79086 5.79086 6 8 6H24L30 14H56C58.2091 14 60 15.7909 60 18V54C60 56.2091 58.2091 58 56 58H8C5.79086 58 4 56.2091 4 54V10Z" fill="#D89E1B" />
      {/* Paper inside */}
      <path d="M10 12H54V30H10V12Z" fill="#F3F4F6" opacity="0.9" />
      <path d="M14 16H44V18H14V16ZM14 22H34V24H14V22Z" fill="#D1D5DB" />
      {/* Front flap */}
      <path d="M4 18C4 16.8954 4.89543 16 6 16H58C59.1046 16 60 16.8954 60 18V54C60 55.1046 59.1046 56 58 56H6C4.89543 56 4 55.1046 4 54V18Z" fill="#FFCA4F" />
      {/* Highlight line on front flap top */}
      <path d="M4 18H60V19.5H4V18Z" fill="#FFE28C" opacity="0.6" />
      {/* Bottom shadow */}
      <path d="M4 53.5H60V54.5H4V53.5Z" fill="#C68A0D" opacity="0.4" />
    </svg>
  );
}

// Windows-style file icon
export function WindowsFileIcon({ className = "h-12 w-12", extension = "" }: { className?: string, extension?: string }) {
  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(extension.toLowerCase());
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8C12 5.79086 13.7909 4 16 4H38L52 18V56C52 58.2091 50.2091 60 48 60H16C13.7909 60 12 58.2091 12 56V8Z" fill="#ECEFF1" />
      <path d="M38 4V18H52L38 4Z" fill="#CFD8DC" />
      {isImage ? (
        <path d="M18 42L26 32L34 40L44 28L48 32V50H18V42Z" fill="#4CAF50" opacity="0.8" />
      ) : (
        <path d="M20 28H44V30H20V28ZM20 36H44V38H20V36ZM20 44H34V46H20V44Z" fill="#B0BEC5" />
      )}
    </svg>
  );
}

export interface ExplorerItem {
  id: string;
  name: string;
  type: "folder" | "file";
  parentId: string | null;
  size?: number;
  updatedAt?: string;
  url?: string;
  thumbnailUrl?: string | null;
  isPaid?: boolean;
  category?: string;
  level?: string;
  instructor?: string;
  duration?: string;
  students?: string;
  price?: string;
  description?: string;
  visibility?: string;
  slug?: string;
  studentId?: string | null;
  approved?: boolean;
}

interface WindowsExplorerProps {
  items: ExplorerItem[];
  title: string;
  rootName?: string;
  onCreateFolder?: (name: string, description: string, isPaid: boolean, parentId: string | null) => Promise<any>;
  onRenameItem?: (id: string, isFolder: boolean, newName: string) => Promise<any>;
  onDeleteItems?: (folderIds: string[], fileIds: string[]) => Promise<any>;
  onUploadFile?: (file: File, parentId: string | null) => Promise<any>;
  onItemDoubleClick?: (item: ExplorerItem) => void;
  onSaveProperties?: (id: string, metadata: {
    category?: string;
    level?: string;
    instructor?: string;
    duration?: string;
    students?: string;
    price?: string;
    description?: string;
    thumbnailUrl?: string;
    visibility?: string;
    slug?: string;
  }) => Promise<any>;
  onEditCourse?: (item: ExplorerItem) => void;
  onAdvanceEdit?: (item: ExplorerItem) => void;
  onSelectLibraryAsset?: (url: string, name: string, parentId: string | null) => Promise<any>;
  // Controls
  showAccessSelector?: boolean;
}

export function WindowsExplorer({
  items,
  title,
  rootName = "Sys (C:)",
  onCreateFolder,
  onRenameItem,
  onDeleteItems,
  onUploadFile,
  onItemDoubleClick,
  onSaveProperties,
  onEditCourse,
  onAdvanceEdit,
  onSelectLibraryAsset,
  showAccessSelector = false,
}: WindowsExplorerProps) {
  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([null]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isCatalog = title.toLowerCase().includes("catalog") || title.toLowerCase().includes("curriculum") || title.toLowerCase().includes("course");

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: ExplorerItem } | null>(null);

  // Workspace reference for drag select
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [dragBox, setDragBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  // Student Enrollment and Profile States
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<ExplorerItem | null>(null);
  const [availableCourses, setAvailableCourses] = useState<{ id: string; name: string }[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileTarget, setProfileTarget] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const openEnrollDialog = async (item: ExplorerItem) => {
    setEnrollTarget(item);
    setEnrollDialogOpen(true);
    setSelectedCourseName("");
    try {
      const { data } = await db.from('course_folders').select('*').eq('parent_folder_id', null);
      if (data) {
        const courses = data
          .filter((c: any) => c.course_id !== 'assessments')
          .map((c: any) => ({ id: c.id, name: c.title }));
        setAvailableCourses(courses);
        if (courses.length > 0) {
          setSelectedCourseName(courses[0].name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnrollSubmit = async () => {
    if (!enrollTarget?.studentId || !selectedCourseName) return;
    setEnrolling(true);
    try {
      const { data: profile, error: fetchErr } = await db.from('profiles').select('*').eq('id', enrollTarget.studentId).single();
      if (fetchErr) throw fetchErr;

      const enrolled = profile?.enrolled_courses || [];
      if (!enrolled.includes(selectedCourseName)) {
        enrolled.push(selectedCourseName);
      }

      const { error: updateErr } = await db.from('profiles').update({ enrolled_courses: enrolled }).eq('id', enrollTarget.studentId);
      if (updateErr) throw updateErr;

      alert(`Successfully enrolled student in "${selectedCourseName}"!`);
      setEnrollDialogOpen(false);
      window.location.reload();
    } catch (e: any) {
      alert(`Enrollment failed: ${e.message || String(e)}`);
    } finally {
      setEnrolling(false);
    }
  };

  const openProfileDialog = async (item: ExplorerItem) => {
    if (!item.studentId) return;
    setProfileTarget(null);
    setProfileDialogOpen(true);
    setProfileLoading(true);
    try {
      const { data, error } = await db.from('profiles').select('*').eq('id', item.studentId).single();
      if (!error && data) {
        setProfileTarget(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  };

  // Modals / Actions
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");
  const [newFolderIsPaid, setNewFolderIsPaid] = useState(false);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ExplorerItem | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Properties / Course Details Modal States
  const [propertiesDialogOpen, setPropertiesDialogOpen] = useState(false);
  const [propertiesTarget, setPropertiesTarget] = useState<ExplorerItem | null>(null);
  const [courseCategory, setCourseCategory] = useState("Programming");
  const [courseLevel, setCourseLevel] = useState("Beginner");
  const [courseInstructor, setCourseInstructor] = useState("");
  const [courseDuration, setCourseDuration] = useState("");
  const [courseStudents, setCourseStudents] = useState("");
  const [coursePrice, setCoursePrice] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseThumbnail, setCourseThumbnail] = useState("");
  const [courseVisibility, setCourseVisibility] = useState("Private");
  const [courseSlug, setCourseSlug] = useState("");
  const [savingProperties, setSavingProperties] = useState(false);

  // Expanded folders in sidebar
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Theme State
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await db.auth.getUser();
        if (user) {
          const { data: profile } = await db.from('profiles').select('*').eq('email', user.email).single();
          if (profile?.role) {
            setUserRole(profile.role);
          }
        }
      } catch (err) {
        console.error("Failed to load user role", err);
      }
    };
    fetchUserRole();
  }, []);

  // Initialize theme from global settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isGlobalDark = document.documentElement.classList.contains("dark");
      setIsDarkTheme(isGlobalDark);
    }
  }, []);

  // Reset selection when folder changes
  useEffect(() => {
    setSelectedIds([]);
  }, [currentFolderId]);

  // Context Menu Custom Event Dispatchers Bridge
  useEffect(() => {
    const handleOpenItem = (e: any) => {
      const { id, type } = e.detail;
      const matched = items.find(item => item.id === id);
      if (matched) {
        handleDoubleClick(matched);
      }
    };

    const handleRenameItemEvent = (e: any) => {
      const { id } = e.detail;
      const matched = items.find(item => item.id === id);
      if (matched) {
        setRenameTarget(matched);
        setRenameValue(matched.name);
        setRenameDialogOpen(true);
      }
    };

    const handleDeleteItemEvent = async (e: any) => {
      const { id, type } = e.detail;
      if (!onDeleteItems) return;
      if (type === 'folder') {
        await onDeleteItems([id], []);
      } else {
        await onDeleteItems([], [id]);
      }
    };

    const handleOpenPropertiesEvent = (e: any) => {
      const { id } = e.detail;
      const matched = items.find(item => item.id === id);
      if (matched) {
        setPropertiesTarget(matched);
        setCourseCategory(matched.category || "Programming");
        setCourseLevel(matched.level || "Beginner");
        setCourseInstructor(matched.instructor || "");
        setCourseDuration(matched.duration || "");
        setCourseStudents(matched.students || "");
        setCoursePrice(matched.price || "");
        setCourseDesc(matched.description || "");
        setCourseThumbnail(matched.thumbnailUrl || "");
        setCourseVisibility(matched.visibility || "Private");
        setCourseSlug(matched.slug || "");
        setPropertiesDialogOpen(true);
      }
    };

    const handleEditCourseEvent = (e: any) => {
      const { id } = e.detail;
      const matched = items.find(item => item.id === id);
      if (matched && onEditCourse) {
        onEditCourse(matched);
      }
    };

    const handleAdvanceEditEvent = (e: any) => {
      const { id } = e.detail;
      const matched = items.find(item => item.id === id);
      if (matched && onAdvanceEdit) {
        onAdvanceEdit(matched);
      }
    };

    window.addEventListener('explorer-open-item', handleOpenItem);
    window.addEventListener('explorer-rename-item', handleRenameItemEvent);
    window.addEventListener('explorer-delete-item', handleDeleteItemEvent);
    window.addEventListener('explorer-open-properties', handleOpenPropertiesEvent);
    window.addEventListener('explorer-edit-course', handleEditCourseEvent);
    window.addEventListener('explorer-advance-edit', handleAdvanceEditEvent);

    return () => {
      window.removeEventListener('explorer-open-item', handleOpenItem);
      window.removeEventListener('explorer-rename-item', handleRenameItemEvent);
      window.removeEventListener('explorer-delete-item', handleDeleteItemEvent);
      window.removeEventListener('explorer-open-properties', handleOpenPropertiesEvent);
      window.removeEventListener('explorer-edit-course', handleEditCourseEvent);
      window.removeEventListener('explorer-advance-edit', handleAdvanceEditEvent);
    };
  }, [items, onDeleteItems, onEditCourse, onAdvanceEdit]);

  // Drag select listener
  useEffect(() => {
    const container = workspaceRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Prevent drag-select starting on interactive elements
      if (
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('input') ||
        (e.target as HTMLElement).closest('a') ||
        (e.target as HTMLElement).closest('[role="dialog"]') ||
        (e.target as HTMLElement).closest('.explorer-item-card')
      ) {
        return;
      }

      startPos.current = { x: e.clientX, y: e.clientY };
      setDragBox({ x: 0, y: 0, w: 0, h: 0 });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!startPos.current) return;

      const x = Math.min(startPos.current.x, e.clientX);
      const y = Math.min(startPos.current.y, e.clientY);
      const w = Math.abs(startPos.current.x - e.clientX);
      const h = Math.abs(startPos.current.y - e.clientY);

      // Convert screen-space box to container-relative coordinate system for drawing the drag border box
      const rect = container.getBoundingClientRect();
      const relativeX = x - rect.left + container.scrollLeft;
      const relativeY = y - rect.top + container.scrollTop;

      setDragBox({ x: relativeX, y: relativeY, w, h });

      // Determine overlapping cards using screen space positions
      const cards = container.querySelectorAll('.explorer-item-card');
      const selected: string[] = [];

      cards.forEach((card) => {
        const el = card as HTMLElement;
        const id = el.getAttribute('data-id');
        if (!id) return;

        const cardRect = el.getBoundingClientRect();

        const isOverlapping =
          x < cardRect.right &&
          x + w > cardRect.left &&
          y < cardRect.bottom &&
          y + h > cardRect.top;

        if (isOverlapping) {
          selected.push(id);
        }
      });

      setSelectedIds(selected);
    };

    const handleMouseUp = () => {
      startPos.current = null;
      setDragBox(null);
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [items]);

  // Navigate function
  const navigateTo = (folderId: string | null) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(folderId);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentFolderId(folderId);
  };

  const navigateBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentFolderId(history[historyIndex - 1]);
    }
  };

  const navigateForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentFolderId(history[historyIndex + 1]);
    }
  };

  const navigateUp = () => {
    if (currentFolderId === null) return;
    const currentFolder = items.find(item => item.id === currentFolderId && item.type === "folder");
    navigateTo(currentFolder ? currentFolder.parentId : null);
  };

  // Build folder hierarchy tree for sidebar
  const folderTree = useMemo(() => {
    const folders = items.filter(item => item.type === "folder");
    const map = new Map<string, any>();
    folders.forEach(f => map.set(f.id, { ...f, children: [] }));
    const roots: any[] = [];

    map.forEach(folder => {
      if (folder.parentId && map.has(folder.parentId)) {
        map.get(folder.parentId).children.push(folder);
      } else {
        roots.push(folder);
      }
    });
    return roots;
  }, [items]);

  // Items in the current active folder (filtered by search)
  const currentItems = useMemo(() => {
    let filtered = items.filter(item => {
      if (searchQuery.trim() !== "") {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return item.parentId === currentFolderId;
    });
    return filtered;
  }, [items, currentFolderId, searchQuery]);

  // Address bar path calculation
  const pathSegments = useMemo(() => {
    const segments: { id: string | null; name: string }[] = [{ id: null, name: rootName }];
    if (!currentFolderId) return segments;

    const path: { id: string; name: string }[] = [];
    let currId: string | null = currentFolderId;
    while (currId) {
      const folder = items.find(item => item.id === currId && item.type === "folder");
      if (folder) {
        path.unshift({ id: folder.id, name: folder.name });
        currId = folder.parentId;
      } else {
        break;
      }
    }
    return [...segments, ...path];
  }, [items, currentFolderId, rootName]);

  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;

    if (isModifierPressed) {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleGridBackgroundClick = () => {
    setSelectedIds([]);
  };

  const handleDoubleClick = (item: ExplorerItem) => {
    if (item.type === "folder") {
      navigateTo(item.id);
    } else if (onItemDoubleClick) {
      onItemDoubleClick(item);
    }
  };

  // Actions trigger functions
  const handleCreateFolderSubmit = async () => {
    if (!newFolderName.trim() || !onCreateFolder) return;
    await onCreateFolder(newFolderName.trim(), newFolderDesc.trim(), newFolderIsPaid, currentFolderId);
    setNewFolderName("");
    setNewFolderDesc("");
    setNewFolderIsPaid(false);
    setCreateDialogOpen(false);
  };

  const handleRenameSubmit = async () => {
    if (!renameValue.trim() || !renameTarget || !onRenameItem) return;
    await onRenameItem(renameTarget.id, renameTarget.type === "folder", renameValue.trim());
    setRenameTarget(null);
    setRenameValue("");
    setRenameDialogOpen(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0 || !onDeleteItems) return;
    const itemsToDelete = items.filter(item => selectedIds.includes(item.id));
    const folderIds = itemsToDelete.filter(i => i.type === "folder").map(i => i.id);
    const fileIds = itemsToDelete.filter(i => i.type === "file").map(i => i.id);
    await onDeleteItems(folderIds, fileIds);
    setSelectedIds([]);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !onUploadFile) return;
    await onUploadFile(uploadFile, currentFolderId);
    setUploadFile(null);
    setUploadDialogOpen(false);
  };

  const handleSavePropertiesSubmit = async () => {
    if (!propertiesTarget || !onSaveProperties) return;
    setSavingProperties(true);
    try {
      await onSaveProperties(propertiesTarget.id, {
        category: courseCategory,
        level: courseLevel,
        instructor: courseInstructor,
        duration: courseDuration,
        students: courseStudents,
        price: coursePrice,
        description: courseDesc,
        thumbnailUrl: courseThumbnail,
        visibility: courseVisibility,
        slug: courseSlug,
      });
      setPropertiesDialogOpen(false);
      setPropertiesTarget(null);
    } catch (e: any) {
      alert(`Failed to save properties: ${e.message || String(e)}`);
    } finally {
      setSavingProperties(false);
    }
  };

  // Helper to toggle sidebar folders expand/collapse
  const toggleSidebarExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Sidebar tree rendering helper
  const renderSidebarFolder = (folder: any, depth = 0) => {
    const isExpanded = !!expandedFolders[folder.id];
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = currentFolderId === folder.id;

    return (
      <div key={folder.id} className="select-none">
        <div
          onClick={() => {
            navigateTo(folder.id);
            setSidebarOpen(false);
          }}
          className={cn(
            "flex items-center gap-1 py-1 px-2 rounded cursor-pointer text-xs transition-colors",
            isDarkTheme 
              ? "hover:bg-neutral-800 text-neutral-300" 
              : "hover:bg-neutral-200 text-neutral-700",
            isSelected && (
              isDarkTheme
                ? "bg-[#0078d7]/20 text-white font-medium border border-[#0078d7]"
                : "bg-[#0078d7]/15 text-neutral-900 font-medium border border-[#0078d7]"
            )
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="w-4 h-4 flex items-center justify-center">
            {hasChildren && (
              <button 
                onClick={(e) => toggleSidebarExpand(folder.id, e)} 
                className={cn("p-0.5 rounded", isDarkTheme ? "hover:bg-neutral-700" : "hover:bg-neutral-300")}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-neutral-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-neutral-500" />
                )}
              </button>
            )}
          </span>
          <Folder className="h-4.5 w-4.5 text-yellow-500 shrink-0 mr-1" />
          <span className="truncate">{folder.name}</span>
        </div>
        {isExpanded && hasChildren && (
          <div className="mt-0.5">
            {folder.children.map((child: any) => renderSidebarFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-[700px] border rounded-lg shadow-2xl font-sans overflow-hidden transition-colors duration-200 w-full max-w-full",
      isDarkTheme 
        ? "bg-[#1e1e1e] text-neutral-200 border-neutral-800" 
        : "bg-white text-neutral-800 border-neutral-200"
    )}>
      {/* 1. Header Toolbar */}
      <div className={cn(
        "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-3 py-2 border-b select-none",
        isDarkTheme ? "bg-[#181818] border-neutral-800" : "bg-[#f3f3f3] border-neutral-200"
      )}>
        <div className="flex items-center gap-1.5 flex-wrap">
          {onCreateFolder && (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "text-xs h-8 px-2",
                isDarkTheme 
                  ? "text-neutral-300 hover:bg-neutral-800 hover:text-white" 
                  : "text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
              )}
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1 text-emerald-500" /> {isCatalog && currentFolderId === null ? "New Course" : "New Folder"}
            </Button>
          )}
          {onUploadFile && (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "text-xs h-8 px-2",
                isDarkTheme 
                  ? "text-neutral-300 hover:bg-neutral-800 hover:text-white" 
                  : "text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
              )}
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-1 text-sky-500" /> Upload File
            </Button>
          )}
          {selectedIds.length > 0 && (
            <>
              {onRenameItem && selectedIds.length === 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "text-xs h-8 px-2",
                    isDarkTheme 
                      ? "text-neutral-300 hover:bg-neutral-800 hover:text-white" 
                      : "text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
                  )}
                  onClick={() => {
                    const matched = items.find(item => item.id === selectedIds[0]);
                    if (matched) {
                      setRenameTarget(matched);
                      setRenameValue(matched.name);
                      setRenameDialogOpen(true);
                    }
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-1 text-amber-500" /> Rename
                </Button>
              )}
              {onDeleteItems && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "text-xs h-8 px-2",
                    isDarkTheme 
                      ? "text-neutral-300 hover:bg-neutral-800 hover:text-white" 
                      : "text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
                  )}
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-4 w-4 mr-1 text-rose-500" /> Delete ({selectedIds.length})
                </Button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-0 pt-1.5 sm:pt-0 border-neutral-200/20">
          <div className={cn("text-xs font-semibold uppercase tracking-wider", isDarkTheme ? "text-neutral-400" : "text-neutral-500")}>
            {title}
          </div>
          {/* Light/Dark Toggle Switch */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className={cn(
              "h-8 w-8 rounded-full",
              isDarkTheme ? "hover:bg-neutral-800 text-yellow-400" : "hover:bg-neutral-200 text-slate-700"
            )}
            title={isDarkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkTheme ? (
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
              </svg>
            ) : (
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </Button>
        </div>
      </div>

      {/* 2. Address & Navigation Bar */}
      <div className={cn(
        "flex flex-col md:flex-row items-stretch md:items-center gap-2 px-3 py-1.5 border-b select-none",
        isDarkTheme ? "bg-[#252526] border-neutral-800" : "bg-[#f5f5f5] border-neutral-200"
      )}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile Sidebar Toggle Button */}
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-7 w-7 md:hidden",
                isDarkTheme ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900",
                sidebarOpen && (isDarkTheme ? "bg-neutral-800 text-white" : "bg-neutral-200 text-neutral-900")
              )}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Sidebar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-7 w-7 disabled:opacity-30",
                isDarkTheme ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
              )}
              disabled={historyIndex <= 0}
              onClick={navigateBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-7 w-7 disabled:opacity-30",
                isDarkTheme ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
              )}
              disabled={historyIndex >= history.length - 1}
              onClick={navigateForward}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-7 w-7 disabled:opacity-30",
                isDarkTheme ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
              )}
              disabled={currentFolderId === null}
              onClick={navigateUp}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Path Address Bar */}
          <div className={cn(
            "flex-1 flex items-center border rounded px-2 py-0.5 text-xs min-w-0 overflow-hidden h-7",
            isDarkTheme ? "bg-[#1e1e1e] border-neutral-700 text-neutral-300" : "bg-white border-neutral-300 text-neutral-700"
          )}>
            <Computer className="h-3.5 w-3.5 mr-1 text-neutral-400 shrink-0" />
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
              {pathSegments.map((seg, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-neutral-500 shrink-0" />}
                  <span
                    onClick={() => {
                      navigateTo(seg.id);
                      setSidebarOpen(false);
                    }}
                    className="hover:underline hover:text-blue-500 cursor-pointer select-none"
                  >
                    {seg.name}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${rootName}`}
            className={cn(
              "text-xs h-7 pl-8 focus:border-[#0078d7] focus:ring-0 focus-visible:ring-0 placeholder-neutral-500 rounded",
              isDarkTheme ? "bg-[#1e1e1e] border-neutral-700 text-neutral-200" : "bg-white border-neutral-300 text-neutral-800"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Split Window (Sidebar + Grid view) */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Tree Sidebar Panel */}
        <div className={cn(
          "w-56 border-r p-2 overflow-y-auto space-y-4 select-none shrink-0 scrollbar-thin transition-all duration-300 md:relative absolute left-0 top-0 bottom-0 md:translate-x-0 z-30 h-full",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isDarkTheme ? "bg-[#252526] border-neutral-800" : "bg-[#f5f5f5] border-neutral-200"
        )}>
          {/* Quick Access */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-2">
              <div className={cn("text-[10px] font-bold uppercase tracking-wider", isDarkTheme ? "text-neutral-500" : "text-neutral-400")}>Quick Access</div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className={cn("p-1 rounded md:hidden", isDarkTheme ? "hover:bg-neutral-800 text-neutral-400" : "hover:bg-neutral-200 text-neutral-600")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div
              onClick={() => {
                navigateTo(null);
                setSidebarOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 py-1 px-2 rounded cursor-pointer text-xs transition-colors",
                isDarkTheme ? "hover:bg-neutral-800 text-neutral-300" : "hover:bg-neutral-200 text-neutral-700",
                currentFolderId === null && (
                  isDarkTheme
                    ? "bg-[#0078d7]/20 text-white font-medium border border-[#0078d7]"
                    : "bg-[#0078d7]/15 text-neutral-900 font-medium border border-[#0078d7]"
                )
              )}
            >
              <HardDrive className="h-4.5 w-4.5 text-sky-400 shrink-0" />
              <span>{rootName} Root</span>
            </div>
            
            {/* Recycle Bin Link */}
            <a
              href="/recycle-bin"
              className={cn(
                "flex items-center gap-2 py-1 px-2 rounded cursor-pointer text-xs transition-colors text-rose-400 hover:bg-neutral-800/50"
              )}
            >
              <Trash2 className="h-4.5 w-4.5 text-rose-400 shrink-0" />
              <span>Recycle Bin</span>
            </a>
          </div>

          {/* Directory Tree */}
          <div className="space-y-1">
            <div className={cn("text-[10px] font-bold px-2 uppercase tracking-wider", isDarkTheme ? "text-neutral-500" : "text-neutral-400")}>Directories</div>
            <div className="pl-1">
              {folderTree.map(folder => renderSidebarFolder(folder))}
              {folderTree.length === 0 && (
                <div className="text-[10px] text-neutral-500 italic pl-2">No folders found</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Main Grid Workspace */}
        <div
          ref={workspaceRef}
          onClick={handleGridBackgroundClick}
          className={cn(
            "flex-1 p-4 overflow-y-auto scrollbar-thin select-none relative",
            isDarkTheme ? "bg-[#1e1e1e]" : "bg-white"
          )}
        >
          {/* Selection Drag Box Overlay */}
          {dragBox && dragBox.w >= 5 && dragBox.h >= 5 && (
            <div
              style={{
                left: dragBox.x,
                top: dragBox.y,
                width: dragBox.w,
                height: dragBox.h,
              }}
              className="absolute pointer-events-none border border-[#0078d7] bg-[#0078d7]/15 rounded-sm z-50 animate-in fade-in-20 duration-75"
            />
          )}

          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-2">
              <FolderSymlink className="h-12 w-12 text-neutral-600" />
              <p className="text-sm">This folder is empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {currentItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const fileExt = item.name.split(".").pop() || "";
                return (
                  <div
                    key={item.id}
                    data-id={item.id}
                    data-type={item.type}
                    data-name={item.name}
                    data-url={item.url || ''}
                    onClick={(e) => handleItemClick(e, item.id)}
                    onDoubleClick={() => handleDoubleClick(item)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY, item });
                    }}
                    className={cn(
                      "explorer-item-card relative flex flex-col items-center p-2 rounded text-center border border-transparent cursor-pointer transition-all duration-200 select-none group",
                      isDarkTheme 
                        ? "hover:bg-neutral-800/50 hover:border-neutral-700 text-neutral-300"
                        : "hover:bg-neutral-100 hover:border-neutral-300 text-neutral-800",
                      isSelected && (
                        isDarkTheme
                          ? "bg-[#0078d7]/15 border-[#0078d7] ring-1 ring-[#0078d7]/30 text-white font-semibold"
                          : "bg-[#0078d7]/15 border-[#0078d7] ring-1 ring-[#0078d7]/20 text-neutral-900 font-semibold"
                      )
                    )}
                  >
                    {/* Checkbox Selector - visible on hover or if selected */}
                    <div className={cn(
                      "absolute top-1.5 left-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity",
                      isSelected ? "opacity-100" : ""
                    )}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedIds(prev =>
                            prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]
                          );
                        }}
                        className="h-3.5 w-3.5 rounded border-neutral-400 text-[#0078d7] focus:ring-[#0078d7]/30 cursor-pointer bg-white dark:bg-neutral-800"
                      />
                    </div>

                    {/* Icon Container */}
                    <div className="relative mb-2 animate-in fade-in zoom-in-95 duration-150 mt-2">
                      {item.type === "folder" ? (
                        <WindowsFolderIcon className="h-12 w-12 drop-shadow-sm" />
                      ) : item.thumbnailUrl ? (
                        <div className={cn(
                          "h-12 w-12 rounded border overflow-hidden flex items-center justify-center",
                          isDarkTheme ? "border-neutral-700 bg-neutral-800" : "border-neutral-300 bg-neutral-100"
                        )}>
                          <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <WindowsFileIcon className="h-12 w-12 drop-shadow-sm" extension={fileExt} />
                      )}
                    </div>

                    {/* Name */}
                    <span className="text-[11px] font-medium leading-tight line-clamp-2 max-w-full break-all px-1 select-none">
                      {item.name}
                    </span>

                    {/* Folder Badges (like Access Free/Paid) */}
                    <div className="flex gap-1 flex-wrap justify-center mt-1">
                      {item.isPaid !== undefined && (
                        <span className={cn(
                          "text-[8px] font-bold px-1.5 py-0.2 rounded-full border shrink-0",
                          item.isPaid 
                            ? "bg-amber-950/40 text-amber-400 border-amber-800/30"
                            : "bg-emerald-950/40 text-emerald-400 border-emerald-800/30"
                        )}>
                          {item.isPaid ? "Paid" : "Free"}
                        </span>
                      )}
                      {item.type === 'folder' && !item.parentId && item.approved === false && (
                        <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 bg-rose-950/40 text-rose-400 border-rose-800/30">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Footer Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#0078d7] text-white text-[11px] select-none shrink-0 font-medium">
        <div>{items.length} items</div>
        {selectedIds.length > 0 && (
          <div>{selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected</div>
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* Create Folder Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className={cn(
          "border rounded-lg",
          isDarkTheme ? "bg-[#1e1e1e] border-neutral-800 text-neutral-200" : "bg-white border-neutral-200 text-neutral-800"
        )}>
          <DialogHeader>
            <DialogTitle>{isCatalog && currentFolderId === null ? "Create New Course" : "Create New Folder"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <Label htmlFor="folder-name" className={cn("text-xs", isDarkTheme ? "text-neutral-400" : "text-neutral-500")}>
                {isCatalog && currentFolderId === null ? "Course Title" : "Folder Name"}
              </Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={isCatalog && currentFolderId === null ? "Course Title (e.g. PYTHON COURSE)" : "Folder Name"}
                className={cn(
                  "text-sm focus:border-[#0078d7]",
                  isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-neutral-200" : "bg-white border-neutral-300 text-neutral-800"
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="folder-desc" className={cn("text-xs", isDarkTheme ? "text-neutral-400" : "text-neutral-500")}>Description (Optional)</Label>
              <Input
                id="folder-desc"
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                placeholder={isCatalog && currentFolderId === null ? "Brief course summary..." : "Brief summary..."}
                className={cn(
                  "text-sm focus:border-[#0078d7]",
                  isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-neutral-200" : "bg-white border-neutral-300 text-neutral-800"
                )}
              />
            </div>
            {showAccessSelector && (
              <div className="space-y-1">
                <Label htmlFor="folder-access" className={cn("text-xs", isDarkTheme ? "text-neutral-400" : "text-neutral-500")}>Access Level</Label>
                <Select
                  value={newFolderIsPaid ? "paid" : "free"}
                  onValueChange={(val) => setNewFolderIsPaid(val === "paid")}
                >
                  <SelectTrigger className={cn(
                    "h-9",
                    isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-neutral-200" : "bg-white border-neutral-300 text-neutral-800"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={cn(
                    "border",
                    isDarkTheme ? "bg-[#1e1e1e] border-neutral-800 text-neutral-200" : "bg-white border-neutral-200 text-neutral-800"
                  )}>
                    <SelectItem value="free">Free Access</SelectItem>
                    <SelectItem value="paid">Paid Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              className={cn(isDarkTheme ? "text-neutral-400 hover:bg-neutral-800" : "text-neutral-600 hover:bg-neutral-100")} 
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-[#0078d7] hover:bg-[#0078d7]/90 text-white font-bold" onClick={handleCreateFolderSubmit}>
              {isCatalog && currentFolderId === null ? "Create Course" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className={cn(
          "border rounded-lg",
          isDarkTheme ? "bg-[#1e1e1e] border-neutral-800 text-neutral-200" : "bg-white border-neutral-200 text-neutral-800"
        )}>
          <DialogHeader>
            <DialogTitle>Rename Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <Label htmlFor="rename-input" className={cn("text-xs", isDarkTheme ? "text-neutral-400" : "text-neutral-500")}>New Name</Label>
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className={cn(
                  "text-sm focus:border-[#0078d7]",
                  isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-neutral-200" : "bg-white border-neutral-300 text-neutral-800"
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              className={cn(isDarkTheme ? "text-neutral-400 hover:bg-neutral-800" : "text-neutral-600 hover:bg-neutral-100")} 
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-[#0078d7] hover:bg-[#0078d7]/90 text-white font-bold" onClick={handleRenameSubmit}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className={cn(
          "border rounded-lg",
          isDarkTheme ? "bg-[#1e1e1e] border-neutral-800 text-neutral-200" : "bg-white border-neutral-200 text-neutral-800"
        )}>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <Label htmlFor="upload-file" className={cn("text-xs", isDarkTheme ? "text-neutral-400" : "text-neutral-500")}>Choose File</Label>
              <Input
                id="upload-file"
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className={cn(
                  "text-sm cursor-pointer h-10 file:rounded file:px-2 file:py-1",
                  isDarkTheme 
                    ? "bg-[#2d2d2d] border-neutral-700 text-neutral-200 file:bg-neutral-800 file:text-neutral-200 file:border-0" 
                    : "bg-white border-neutral-300 text-neutral-800 file:bg-neutral-100 file:text-neutral-800 file:border-0"
                )}
              />
            </div>
            
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700/20">
              <Label className={cn("text-[10px] font-bold uppercase tracking-wider", isDarkTheme ? "text-neutral-500" : "text-neutral-400")}>Or Pick Existing Asset</Label>
              <ImagePicker
                onSelect={async (url) => {
                  if (onSelectLibraryAsset) {
                    const fileName = url.split('/').pop() || 'asset';
                    await onSelectLibraryAsset(url, fileName, currentFolderId);
                    setUploadDialogOpen(false);
                  }
                }}
                trigger={
                  <Button type="button" variant="outline" className={cn(
                    "text-xs font-bold w-full h-10 rounded-lg border",
                    isDarkTheme ? "border-neutral-700 hover:bg-neutral-800 text-white" : "border-neutral-300 hover:bg-neutral-100 text-neutral-800"
                  )}>
                    <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Choose from Library
                  </Button>
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              className={cn(isDarkTheme ? "text-neutral-400 hover:bg-neutral-800" : "text-neutral-600 hover:bg-neutral-100")} 
              onClick={() => setUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-[#0078d7] hover:bg-[#0078d7]/90 text-white font-bold" onClick={handleUploadSubmit} disabled={!uploadFile}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Properties & Course Details Dialog */}
      <Dialog open={propertiesDialogOpen} onOpenChange={setPropertiesDialogOpen}>
        <DialogContent className={cn(
          "border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto",
          isDarkTheme ? "bg-[#1e1e1e] border-neutral-800 text-neutral-200" : "bg-white border-neutral-200 text-neutral-800"
        )}>
          <DialogHeader>
            <DialogTitle className="font-headline text-lg flex items-center gap-2">
              📂 Properties: {propertiesTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Course Category</Label>
                <Select value={courseCategory} onValueChange={setCourseCategory}>
                  <SelectTrigger className={cn("h-9", isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-white" : "bg-white border-neutral-300 text-neutral-900")}>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent className={isDarkTheme ? "bg-[#1e1e1e] border-neutral-800 text-white" : "bg-white border-neutral-200 text-neutral-900"}>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Architecture">Architecture</SelectItem>
                    <SelectItem value="Backend">Backend</SelectItem>
                    <SelectItem value="Frontend">Frontend</SelectItem>
                    <SelectItem value="Placement Prep">Placement Prep</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Course Level</Label>
                <Select value={courseLevel} onValueChange={setCourseLevel}>
                  <SelectTrigger className={cn("h-9", isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-white" : "bg-white border-neutral-300 text-neutral-900")}>
                    <SelectValue placeholder="Select level..." />
                  </SelectTrigger>
                  <SelectContent className={isDarkTheme ? "bg-[#1e1e1e] border-neutral-800 text-white" : "bg-white border-neutral-200 text-neutral-900"}>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Instructor / Author</Label>
                <Input
                  value={courseInstructor}
                  onChange={(e) => setCourseInstructor(e.target.value)}
                  placeholder="e.g. DR. SARAH INDIGO"
                  className={cn("h-9", isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-white" : "bg-white border-neutral-300 text-neutral-900")}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Duration (Hours)</Label>
                <Input
                  value={courseDuration}
                  onChange={(e) => setCourseDuration(e.target.value)}
                  placeholder="e.g. 12 Hours"
                  className={cn("h-9", isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-white" : "bg-white border-neutral-300 text-neutral-900")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Student Count</Label>
                <Input
                  value={courseStudents}
                  onChange={(e) => setCourseStudents(e.target.value)}
                  placeholder="e.g. 1.2k Students"
                  className={cn("h-9", isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-white" : "bg-white border-neutral-300 text-neutral-900")}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Price (INR)</Label>
                <Input
                  value={coursePrice}
                  onChange={(e) => setCoursePrice(e.target.value)}
                  placeholder="e.g. 9900"
                  className={cn("h-9", isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-white" : "bg-white border-neutral-300 text-neutral-900")}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Course Thumbnail Image URL</Label>
              <Input
                value={courseThumbnail}
                onChange={(e) => setCourseThumbnail(e.target.value)}
                placeholder="Will auto-fetch first image in folder if empty"
                className={cn("h-9", isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-white" : "bg-white border-neutral-300 text-neutral-900")}
              />
              {courseThumbnail && (
                <div className="mt-2 h-20 w-32 border rounded overflow-hidden">
                  <img src={courseThumbnail} alt="Thumbnail preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Course Visibility (Status)</Label>
              <Select value={courseVisibility} onValueChange={setCourseVisibility}>
                <SelectTrigger className={cn("h-9", isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-white" : "bg-white border-neutral-300 text-neutral-900")}>
                  <SelectValue placeholder="Select visibility..." />
                </SelectTrigger>
                <SelectContent className={isDarkTheme ? "bg-[#1e1e1e] border-neutral-800 text-white" : "bg-white border-neutral-200 text-neutral-900"}>
                  <SelectItem value="Public">🌍 Public (Visible on Course Library)</SelectItem>
                  <SelectItem value="Private">🔒 Private (Hidden from course list)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isCatalog && currentFolderId === null && (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Course Slug (URL Route)</Label>
                <Input
                  value={courseSlug}
                  onChange={(e) => setCourseSlug(e.target.value)}
                  placeholder="e.g. python-course"
                  className={cn("h-9", isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-white" : "bg-white border-neutral-300 text-neutral-900")}
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Detailed Course Description (Page view)</Label>
              <Textarea
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
                placeholder="Detailed curriculum course info displayed inside the page slug view..."
                className={cn("min-h-[100px] text-xs", isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-white" : "bg-white border-neutral-300 text-neutral-900")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              className={cn(isDarkTheme ? "text-neutral-400 hover:bg-neutral-800" : "text-neutral-600 hover:bg-neutral-100")} 
              onClick={() => setPropertiesDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#0078d7] hover:bg-[#0078d7]/90 text-white font-bold" 
              onClick={handleSavePropertiesSubmit}
              disabled={savingProperties}
            >
              {savingProperties ? "Saving..." : "Save Properties"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          options={[
            ...(contextMenu.item.type === 'folder' && contextMenu.item.studentId ? [
              {
                label: '🎓 Enroll into Course',
                onClick: () => {
                  openEnrollDialog(contextMenu.item);
                  setContextMenu(null);
                },
                className: 'text-emerald-600 dark:text-emerald-400 font-bold',
              },
              {
                label: '👤 View Student Profile',
                onClick: () => {
                  openProfileDialog(contextMenu.item);
                  setContextMenu(null);
                },
                className: 'text-sky-600 dark:text-sky-400 font-bold',
              }
            ] : []),
            ...(contextMenu.item.type === 'folder' && !contextMenu.item.parentId && isCatalog && contextMenu.item.approved === false && (userRole === 'admin' || userRole === 'super_admin' || userRole === 'superadmin' || userRole === 'support' || userRole === 'staff') ? [{
              label: '✅ Approve Course',
              onClick: async () => {
                const res = await db.from('course_folders').update({ approved: true }).eq('id', contextMenu.item.id);
                setContextMenu(null);
                if (res.error) {
                  alert(`Failed to approve course: ${res.error.message}`);
                } else {
                  alert('Course has been approved and is now live!');
                  setTimeout(() => window.location.reload(), 1200);
                }
              },
              className: 'text-emerald-600 dark:text-emerald-400 font-extrabold',
            }] : []),
            ...(contextMenu.item.type === 'folder' && !contextMenu.item.parentId && isCatalog && onAdvanceEdit ? [{
              label: '🚀 Advance Edit',
              onClick: () => {
                onAdvanceEdit(contextMenu.item);
                setContextMenu(null);
              },
              className: 'text-violet-600 dark:text-violet-400 font-extrabold',
            }] : []),
            ...(contextMenu.item.type === 'folder' && !contextMenu.item.parentId && isCatalog && onEditCourse ? [{
              label: '✏️ Edit Course Page',
              onClick: () => {
                onEditCourse(contextMenu.item);
                setContextMenu(null);
              },
              className: 'text-blue-600 dark:text-blue-400 font-bold',
            }] : []),
            {
              label: contextMenu.item.type === 'folder' ? '📂 Open' : '📄 Open File',
              onClick: () => {
                window.dispatchEvent(new CustomEvent('explorer-open-item', { detail: { id: contextMenu.item.id, type: contextMenu.item.type } }));
                setContextMenu(null);
              },
            },
            ...(contextMenu.item.type === 'folder' && onCreateFolder ? [{
              label: '📁 New Subfolder',
              onClick: () => {
                // Navigate into folder first, then open create dialog
                navigateTo(contextMenu.item.id);
                setContextMenu(null);
                setTimeout(() => setCreateDialogOpen(true), 100);
              },
            }] : []),
            ...(onRenameItem ? [{
              label: '✏️ Rename',
              onClick: () => {
                window.dispatchEvent(new CustomEvent('explorer-rename-item', { detail: { id: contextMenu.item.id } }));
                setContextMenu(null);
              },
            }] : []),
            {
              label: '📋 Copy Name',
              onClick: () => {
                navigator.clipboard.writeText(contextMenu.item.name).catch(() => {});
                setContextMenu(null);
              },
            },
            ...(contextMenu.item.url ? [{
              label: '🔗 Copy Link',
              onClick: () => {
                navigator.clipboard.writeText(contextMenu.item.url!).catch(() => {});
                setContextMenu(null);
              },
            }] : []),
            ...(onSaveProperties && contextMenu.item.type === 'folder' ? [{
              label: '⚙️ Properties',
              onClick: () => {
                window.dispatchEvent(new CustomEvent('explorer-open-properties', { detail: { id: contextMenu.item.id } }));
                setContextMenu(null);
              },
            }] : []),
            ...(onDeleteItems ? [{
              label: '🗑️ Delete',
              onClick: () => {
                window.dispatchEvent(new CustomEvent('explorer-delete-item', { detail: { id: contextMenu.item.id, type: contextMenu.item.type } }));
                setContextMenu(null);
              },
              className: 'text-rose-600 dark:text-rose-400',
            }] : []),
          ]}
        />
      )}

      {/* Enroll Student into Course Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className={cn(
          "border rounded-xl",
          isDarkTheme ? "bg-[#1e1e1e] border-neutral-800 text-neutral-200" : "bg-white border-neutral-200 text-neutral-800"
        )}>
          <DialogHeader>
            <DialogTitle>Enroll {enrollTarget?.name} into Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <Label className={cn("text-xs", isDarkTheme ? "text-neutral-400" : "text-neutral-500")}>Select Course</Label>
              <Select value={selectedCourseName} onValueChange={setSelectedCourseName}>
                <SelectTrigger className={cn(
                  "h-10",
                  isDarkTheme ? "bg-[#2d2d2d] border-neutral-700 text-white" : "bg-white border-neutral-300 text-neutral-900"
                )}>
                  <SelectValue placeholder="Choose course..." />
                </SelectTrigger>
                <SelectContent className={isDarkTheme ? "bg-[#1e1e1e] border-neutral-800 text-white" : "bg-white border-neutral-200 text-neutral-900"}>
                  {availableCourses.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                  {availableCourses.length === 0 && (
                    <SelectItem value="none" disabled>No courses available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              className={cn(isDarkTheme ? "text-neutral-400 hover:bg-neutral-800" : "text-neutral-600 hover:bg-neutral-100")} 
              onClick={() => setEnrollDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-[#0078d7] hover:bg-[#0078d7]/90 text-white font-bold" onClick={handleEnrollSubmit} disabled={enrolling || availableCourses.length === 0}>
              {enrolling ? "Enrolling..." : "Enroll Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Profile Details Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className={cn(
          "border rounded-xl max-w-md",
          isDarkTheme ? "bg-[#1e1e1e] border-neutral-800 text-neutral-200" : "bg-white border-neutral-200 text-neutral-800"
        )}>
          <DialogHeader>
            <DialogTitle>Student Profile Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-sm">
            {profileLoading ? (
              <div className="text-center py-6">Loading profile...</div>
            ) : profileTarget ? (
              <div className="space-y-3">
                <div className="flex justify-between border-b border-neutral-700/20 pb-2">
                  <span className="font-bold">Name:</span>
                  <span>{profileTarget.full_name || 'Anonymous'}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-700/20 pb-2">
                  <span className="font-bold">Email:</span>
                  <span className="font-mono">{profileTarget.email}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-700/20 pb-2">
                  <span className="font-bold">Role:</span>
                  <span className="capitalize">{profileTarget.role || 'student'}</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <span className="font-bold block">Enrolled Courses:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {profileTarget.enrolled_courses && profileTarget.enrolled_courses.length > 0 ? (
                      profileTarget.enrolled_courses.map((c: string, idx: number) => (
                        <span key={idx} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-500 italic">No enrolled courses</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-rose-500">Failed to load student profile.</div>
            )}
          </div>
          <DialogFooter>
            <Button className="bg-[#0078d7] hover:bg-[#0078d7]/90 text-white font-bold" onClick={() => setProfileDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
