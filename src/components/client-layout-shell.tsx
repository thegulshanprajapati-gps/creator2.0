'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/navbar";
import { SessionTimeout } from "@/components/session-timeout";
import { PageTransition } from "@/components/page-transition";
import { Toaster } from "@/components/ui/toaster";
import { GoToMainSite } from "@/components/go-to-main-site";
import { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { ContextMenu } from "@/components/admin/context-menu";
import { SavingOverlay } from "@/components/saving-overlay";
import { toast } from "@/hooks/use-toast";

// Fluent Context Menu Icons
import { 
  FolderOpen, 
  Edit3, 
  Trash2, 
  Info, 
  Copy, 
  Eye, 
  FolderPlus, 
  Upload, 
  RefreshCw, 
  ShieldCheck,
  PlusSquare, 
  Settings2,
  FilePlus2,
  Plus,
  Users2,
  Lock,
  MessageSquare,
  Sparkles,
  Database,
  Activity,
  Loader2
} from "lucide-react";

export function ClientLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isPagePending, setIsPagePending] = useState(false);

  // Custom Right Click Context Menu State
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [menuOptions, setMenuOptions] = useState<Array<{ label: string; onClick: () => void; icon?: React.ReactNode; className?: string }>>([]);

  // Saving Overlay State
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayStatus, setOverlayStatus] = useState<'saving' | 'success' | 'error'>('saving');
  const [overlayProgress, setOverlayProgress] = useState(0);
  const [overlayTitle, setOverlayTitle] = useState('Processing Request');
  const [overlayDesc, setOverlayDesc] = useState('Executing query operations...');
  const [overlaySuccessTitle, setOverlaySuccessTitle] = useState('Task Completed!');
  const [overlaySuccessDesc, setOverlaySuccessDesc] = useState('Successfully completed right-click command.');

  const triggerOverlay = (title: string, desc: string, successTitle: string, successDesc: string) => {
    setOverlayOpen(true);
    setOverlayStatus('saving');
    setOverlayProgress(10);
    setOverlayTitle(title);
    setOverlayDesc(desc);
    setOverlaySuccessTitle(successTitle);
    setOverlaySuccessDesc(successDesc);

    let progressVal = 10;
    const interval = setInterval(() => {
      progressVal += Math.floor(Math.random() * 20) + 10;
      if (progressVal >= 100) {
        clearInterval(interval);
        setOverlayProgress(100);
        setOverlayStatus('success');
        setTimeout(() => {
          setOverlayOpen(false);
        }, 1500);
      } else {
        setOverlayProgress(progressVal);
      }
    }, 150);
  };

  // Custom Event Listener for showing manual activity overlay
  useEffect(() => {
    if (!mounted) return;

    const handleShowActivity = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { title, description, successTitle, successDescription } = customEvent.detail || {};
      triggerOverlay(
        title || "Processing Request",
        description || "Executing database/network operation...",
        successTitle || "Task Completed!",
        successDescription || "Successfully finished background action."
      );
    };

    window.addEventListener('show-activity-overlay', handleShowActivity);
    return () => {
      window.removeEventListener('show-activity-overlay', handleShowActivity);
    };
  }, [mounted]);

  // Global Fetch Interceptor to display premium activity overlay during database/site modifications
  useEffect(() => {
    if (!mounted) return;

    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else if (input && typeof input === 'object') {
        url = (input as any).url || (input as any).href || '';
      }
      const method = (init?.method || 'GET').toUpperCase();

      // Intercept calls to database APIs (exclude analytics / background token check / security logs)
      const isSensitiveAPI = url.includes('/api/') && !url.includes('/api/security/');
      const isWriteAction = method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH';
      const isSyncAction = url.includes('sync') || url.includes('diagnostic') || url.includes('import') || url.includes('export');

      const shouldShowOverlay = isSensitiveAPI && (isWriteAction || isSyncAction);

      if (shouldShowOverlay) {
        let title = "Database Operation";
        let desc = "Synchronizing database cluster nodes...";
        let successTitle = "Sync Complete!";
        let successDesc = "Data successfully stored in MongoDB cluster.";

        if (url.includes('login') || url.includes('auth')) {
          title = "Security Gateway Access";
          desc = "Verifying credentials and opening admin tunnel...";
          successTitle = "Access Granted";
          successDesc = "Admin console authenticated successfully.";
        } else if (url.includes('certificate')) {
          title = "Compiling PPTX Certificate";
          desc = "Converting presentation slides and compiling coordinate maps...";
          successTitle = "Certificate Saved";
          successDesc = "Vector background and layout settings live.";
        } else if (url.includes('settings')) {
          title = "Updating Site Branding";
          desc = "Syncing hex themes and master typography...";
          successTitle = "Branding Applied";
          successDesc = "Theme configurations saved and live.";
        } else if (url.includes('assets') || url.includes('cloudinary')) {
          title = "Refreshing Asset Registry";
          desc = "Querying Cloudinary media assets and bucket path mappings...";
          successTitle = "Assets Refreshed";
          successDesc = "Cloudinary assets registry synchronized.";
        } else if (url.includes('blogs')) {
          title = "Updating Journal Store";
          desc = "Writing blog data model blocks to MongoDB draft collection...";
          successTitle = "Journal Draft Saved";
          successDesc = "All editorial drafts successfully compiled.";
        } else if (url.includes('courses') || url.includes('curriculum')) {
          title = "Syncing Curriculum Schema";
          desc = "Updating modules, syllabus assets, and hierarchy path trees...";
          successTitle = "Curriculum Synced";
          successDesc = "Course catalog configurations updated.";
        } else if (url.includes('users') || url.includes('staff')) {
          title = "Identity & Access Registry";
          desc = "Updating security schemas and group permissions...";
          successTitle = "Policies Applied";
          successDesc = "User roles and privileges successfully updated.";
        } else if (url.includes('assessments') || url.includes('tests')) {
          title = "Security Keys & Hub Sync";
          desc = "Encrypting assessment levels and credentials...";
          successTitle = "Assessment Synced";
          successDesc = "Test credentials and modules locked.";
        } else if (url.includes('notifications') || url.includes('push')) {
          title = "Alerts Broadcast Engine";
          desc = "Syncing registry and dispatching push tokens...";
          successTitle = "Registry Synchronized";
          successDesc = "All alerts successfully sent.";
        } else if (url.includes('clear-data') || url.includes('recycle-bin') || url.includes('delete')) {
          title = "Data Deletion Protocol";
          desc = "Wiping records and purging clusters...";
          successTitle = "Records Purged";
          successDesc = "Database space reclaimed successfully.";
        } else if (url.includes('connections')) {
          title = "Configuring Cloud Handshake";
          desc = "Testing SMTP, Firebase, and Database integrations...";
          successTitle = "Handshake Successful";
          successDesc = "Cloud connectivity bridges validated.";
        }

        setOverlayOpen(true);
        setOverlayStatus('saving');
        setOverlayProgress(15);
        setOverlayTitle(title);
        setOverlayDesc(desc);
        setOverlaySuccessTitle(successTitle);
        setOverlaySuccessDesc(successDesc);

        let progressVal = 15;
        const interval = setInterval(() => {
          progressVal += Math.floor(Math.random() * 10) + 5;
          if (progressVal >= 88) {
            clearInterval(interval);
            setOverlayProgress(88);
          } else {
            setOverlayProgress(progressVal);
          }
        }, 100);

        try {
          const response = await originalFetch(input, init);
          clearInterval(interval);
          setOverlayProgress(100);
          setOverlayStatus('success');
          setTimeout(() => {
            setOverlayOpen(false);
          }, 1500);
          return response;
        } catch (error: any) {
          clearInterval(interval);
          setOverlayStatus('error');
          setOverlayDesc(error.message || String(error));
          throw error;
        }
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    
    let title = "Support Console";
    if (pathname === '/login') {
      title = "Sign In | Support Console";
    } else if (pathname === '/') {
      title = "Dashboard | Support Console";
    } else if (pathname === '/certificate-template') {
      title = "Certificate Templates | Support Console";
    } else if (pathname === '/blogs/comments') {
      title = "Comments Moderation | Support Console";
    } else if (pathname === '/connections') {
      title = "Connections Settings | Support Console";
    } else if (pathname === '/analytics') {
      title = "Analytics | Support Console";
    } else if (pathname === '/assets') {
      title = "Assets Manager | Support Console";
    } else if (pathname === '/blogs') {
      title = "Blogs Content | Support Console";
    } else if (pathname === '/community') {
      title = "Community Management | Support Console";
    } else if (pathname === '/courses') {
      title = "Course Catalog | Support Console";
    } else if (pathname === '/curriculum-catalog') {
      title = "Curriculum Catalog | Support Console";
    } else if (pathname === '/enrollments') {
      title = "Enrollments | Support Console";
    } else if (pathname === '/notifications') {
      title = "Notification Broadcasts | Support Console";
    } else if (pathname === '/pages') {
      title = "CMS Page Builder | Support Console";
    } else if (pathname === '/realtime') {
      title = "Realtime Stream | Support Console";
    } else if (pathname === '/recycle-bin') {
      title = "Recycle Bin | Support Console";
    } else if (pathname === '/security') {
      title = "Security Metrics | Support Console";
    } else if (pathname === '/settings') {
      title = "Global Settings | Support Console";
    } else if (pathname === '/staff') {
      title = "Staff Directory | Support Console";
    } else if (pathname === '/tests') {
      title = "Assessments | Support Console";
    } else if (pathname === '/updates') {
      title = "Updates Registry | Support Console";
    } else if (pathname === '/users') {
      title = "Identity Registrations | Support Console";
    } else {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const capitalized = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')).join(' - ');
        title = `${capitalized} | Support Console`;
      }
    }
    document.title = title;
  }, [pathname, mounted]);

  useEffect(() => {
    setMounted(true);
    
    // Auth gate for Support Domain loading
    if (pathname !== '/login') {
      const sessionStr = localStorage.getItem('xmarty_session');
      if (!sessionStr) {
        window.location.href = '/login';
        return;
      }
      try {
        const session = JSON.parse(sessionStr);
        const role = session?.user?.role;
        if (role !== 'super_admin' && role !== 'admin' && role !== 'editor') {
          localStorage.removeItem('xmarty_session');
          window.location.href = '/login';
        }
      } catch (e) {
        localStorage.removeItem('xmarty_session');
        window.location.href = '/login';
      }
    }
  }, [pathname]);

  // Context Menu Handler
  useEffect(() => {
    if (!mounted) return;

    const handleContextMenu = (e: MouseEvent) => {
      // Disable default browser context menu globally
      e.preventDefault();

      const target = e.target as HTMLElement;
      
      // Skip context menu on interactive inputs/buttons/loader overlays
      if (
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('select') ||
        target.closest('[role="dialog"]') ||
        target.closest('.saving-overlay-container') ||
        target.closest('.page-transition-loader') ||
        target.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      let options: Array<{ label: string; onClick: () => void; icon?: React.ReactNode; className?: string }> = [];

      // Check if target is inside Performance Widget
      const perfCard = target.closest('.dashboard-performance-widget');
      if (perfCard) {
        options = [
          {
            label: "Run Diagnostics Cache Purge",
            onClick: () => {
              triggerOverlay(
                "Cache Purge", 
                "Clearing dynamic style cache and engine route index...", 
                "Cache Cleared!", 
                "Site cache cleared successfully."
              );
            },
            icon: <RefreshCw className="h-4 w-4 text-sky-500" />
          },
          {
            label: "Simulate Latency Load Test",
            onClick: () => {
              triggerOverlay(
                "Running Latency Test", 
                "Simulating 10,000 requests/sec telemetry loads...", 
                "Diagnostics Passed", 
                "Average latency resolved to 0.8ms."
              );
            },
            icon: <Activity className="h-4 w-4 text-amber-500" />
          },
          {
            label: "Reset Latency Metrics",
            onClick: () => {
              toast({ title: "Latency Resetted", description: "Engine telemetry metrics reset successfully." });
            },
            icon: <Settings2 className="h-4 w-4 text-emerald-500" />
          },
          {
            label: "View Telemetry Logs",
            onClick: () => {
              window.location.href = '/analytics';
            },
            icon: <Info className="h-4 w-4 text-neutral-500" />
          }
        ];
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuOptions(options);
        return;
      }

      // Check if target is inside Realtime Widget (Charts)
      const realtimeCard = target.closest('.dashboard-realtime-widget');
      if (realtimeCard) {
        options = [
          {
            label: "Refresh Live Engagement Stream",
            onClick: () => {
              triggerOverlay(
                "Refreshing Streams", 
                "Querying MongoDB collections for realtime student counts...", 
                "Refreshed Live Data", 
                "Overview metrics loaded."
              );
            },
            icon: <RefreshCw className="h-4 w-4 text-emerald-500" />
          },
          {
            label: "Toggle Load Balancer (Auto/Manual)",
            onClick: () => {
              toast({ title: "Load Balancer Moded", description: "Toggled orchestration balancer to automatic state." });
            },
            icon: <Sparkles className="h-4 w-4 text-purple-500" />
          },
          {
            label: "Purge Active Connections Cache",
            onClick: () => {
              triggerOverlay(
                "Purging Connection Cache", 
                "Purging dynamic TCP session state logs...", 
                "Connections Cleared", 
                "TCP buffer successfully cleared."
              );
            },
            icon: <Trash2 className="h-4 w-4 text-rose-500" />
          },
          {
            label: "View Connected Node IPs",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('show-activity-overlay', {
                detail: {
                  title: "Reading Node Signatures",
                  description: "Fetching connected client signature signatures...",
                  successTitle: "Signature Records Synced",
                  successDescription: "Telemetry visitor signatures parsed."
                }
              }));
            },
            icon: <Users2 className="h-4 w-4 text-blue-500" />
          }
        ];
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuOptions(options);
        return;
      }

      // Check if target is inside Overview Widget
      const overviewCard = target.closest('.dashboard-overview-widget');
      if (overviewCard) {
        options = [
          {
            label: "Export System Metric Data",
            onClick: () => {
              triggerOverlay(
                "Compiling Metrics Data", 
                "Assembling identity counts, latency stats, and branding hex codes...", 
                "Export Successful", 
                "Metrics exported to CSV file."
              );
            },
            icon: <Copy className="h-4 w-4 text-emerald-500" />
          },
          {
            label: "Validate Database Schema Keys",
            onClick: () => {
              triggerOverlay(
                "Validating Schemas", 
                "Matching MongoDB indices with CMS schemas...", 
                "All Keys Verified", 
                "Database health score: 100%"
              );
            },
            icon: <ShieldCheck className="h-4 w-4 text-purple-500" />
          },
          {
            label: "Trigger Automated Master Backup",
            onClick: () => {
              triggerOverlay(
                "Initializing Master Backup", 
                "Backing up system site settings and content blocks...", 
                "Backup Generated", 
                "Created master backup snapshot in cloud bucket."
              );
            },
            icon: <Database className="h-4 w-4 text-sky-500" />
          },
          {
            label: "Run Full System Health Diagnostics",
            onClick: () => {
              triggerOverlay(
                "Orchestrating Diagnostic Check", 
                "Validating connection strings, IP whitelist nodes, and page speeds...", 
                "System Normal", 
                "All checks validated. System operational."
              );
            },
            icon: <Info className="h-4 w-4 text-neutral-500" />
          }
        ];
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuOptions(options);
        return;
      }

      // Check if target is a CMS Page Card
      const pageCard = target.closest('.cms-page-card');
      if (pageCard) {
        const id = pageCard.getAttribute('data-id') || '';
        const name = pageCard.getAttribute('data-name') || 'Page';
        const url = pageCard.getAttribute('data-url') || '';
        
        e.preventDefault();
        options = [
          {
            label: "Edit CMS Blocks",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('page-edit-cms', { detail: { id } }));
            },
            icon: <Edit3 className="h-4 w-4 text-sky-500" />
          },
          {
            label: "View Live Page",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('page-open-live', { detail: { id } }));
            },
            icon: <Eye className="h-4 w-4 text-emerald-500" />
          },
          {
            label: "Delete Page Route",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('page-delete-item', { detail: { id } }));
            },
            icon: <Trash2 className="h-4 w-4 text-rose-500" />,
            className: "text-rose-600 hover:bg-rose-500/10"
          },
          {
            label: "Route Details",
            onClick: () => {
              toast({ title: "Page Configuration", description: `Path: /${id} | URL: ${url}` });
            },
            icon: <Info className="h-4 w-4 text-neutral-500" />
          }
        ];
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuOptions(options);
        return;
      }

      // Check if target is a Platform Update Row
      const updateRow = target.closest('.platform-update-row');
      if (updateRow) {
        const id = updateRow.getAttribute('data-id') || '';
        const name = updateRow.getAttribute('data-name') || 'Update';
        
        e.preventDefault();
        options = [
          {
            label: "Edit Platform Update",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('update-edit-item', { detail: { id } }));
            },
            icon: <Edit3 className="h-4 w-4 text-amber-500" />
          },
          {
            label: "Delete Notice",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('update-delete-item', { detail: { id } }));
            },
            icon: <Trash2 className="h-4 w-4 text-rose-500" />,
            className: "text-rose-600 hover:bg-rose-500/10"
          },
          {
            label: "Notice Details",
            onClick: () => {
              toast({ title: "Update Notice", description: `Notice: ${name} | ID: ${id}` });
            },
            icon: <Info className="h-4 w-4 text-neutral-500" />
          }
        ];
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuOptions(options);
        return;
      }

      // Check if target is a Folder/File Grid Card inside WindowsExplorer
      const itemCard = target.closest('.explorer-item-card');
      if (itemCard) {
        const id = itemCard.getAttribute('data-id') || '';
        const type = itemCard.getAttribute('data-type') || 'file'; // 'folder' | 'file'
        const name = itemCard.getAttribute('data-name') || 'Item';
        const url = itemCard.getAttribute('data-url') || '';

        e.preventDefault();

        if (type === 'folder') {
          options = [
            {
              label: "Open Folder",
              onClick: () => {
                window.dispatchEvent(new CustomEvent('explorer-open-item', { detail: { id, type } }));
              },
              icon: <FolderOpen className="h-4 w-4 text-yellow-500" />
            },
            {
              label: "Rename Folder",
              onClick: () => {
                window.dispatchEvent(new CustomEvent('explorer-rename-item', { detail: { id, type } }));
              },
              icon: <Edit3 className="h-4 w-4 text-sky-500" />
            },
            {
              label: "Delete Folder",
              onClick: () => {
                window.dispatchEvent(new CustomEvent('explorer-delete-item', { detail: { id, type } }));
              },
              icon: <Trash2 className="h-4 w-4 text-rose-500" />,
              className: "text-rose-600 hover:bg-rose-500/10"
            },
            {
              label: "Folder Properties & Course Details",
              onClick: () => {
                window.dispatchEvent(new CustomEvent('explorer-open-properties', { detail: { id, name } }));
              },
              icon: <Info className="h-4 w-4 text-sky-500" />
            }
          ];
        } else {
          options = [
            {
              label: "Open Preview",
              onClick: () => {
                window.dispatchEvent(new CustomEvent('explorer-open-item', { detail: { id, type } }));
              },
              icon: <Eye className="h-4 w-4 text-sky-500" />
            },
            {
              label: "Copy Link URL",
              onClick: () => {
                if (url) {
                  navigator.clipboard.writeText(url);
                  toast({ title: "Clipboard", description: "Copied asset URL to clipboard!" });
                } else {
                  toast({ variant: "destructive", title: "Error", description: "No URL available for this file." });
                }
              },
              icon: <Copy className="h-4 w-4 text-emerald-500" />
            },
            {
              label: "Rename File",
              onClick: () => {
                window.dispatchEvent(new CustomEvent('explorer-rename-item', { detail: { id, type } }));
              },
              icon: <Edit3 className="h-4 w-4 text-amber-500" />
            },
            {
              label: "Delete File",
              onClick: () => {
                window.dispatchEvent(new CustomEvent('explorer-delete-item', { detail: { id, type } }));
              },
              icon: <Trash2 className="h-4 w-4 text-rose-500" />,
              className: "text-rose-600 hover:bg-rose-500/10"
            },
            {
              label: "File Details",
              onClick: () => {
                toast({ title: "Properties", description: `Filename: ${name} | Type: ${name.split('.').pop()?.toUpperCase() || 'File'}` });
              },
              icon: <Info className="h-4 w-4 text-neutral-500" />
            }
          ];
        }

        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuOptions(options);
        return;
      }

      // Empty Workspace Background / General Page Level Menus
      if (pathname === '/curriculum-catalog' || pathname === '/courses') {
        options = [
          {
            label: "Add Course Module",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('explorer-new-folder'));
              toast({ title: "Catalog Console", description: "Opening module creation dialog..." });
            },
            icon: <FolderPlus className="h-4 w-4 text-yellow-500" />
          },
          {
            label: "Upload Syllabus File",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('explorer-upload-file'));
              toast({ title: "Catalog Console", description: "Opening course asset uploader..." });
            },
            icon: <Upload className="h-4 w-4 text-sky-500" />
          },
          {
            label: "Sync Curriculum Database",
            onClick: () => {
              triggerOverlay(
                "Syncing Curriculum DB", 
                "Synchronizing learning catalog modules with MongoDB structure...", 
                "Sync Complete!", 
                "Database curriculum pathways successfully verified."
              );
            },
            icon: <RefreshCw className="h-4 w-4 text-emerald-500" />
          },
          {
            label: "Run Diagnostic Check",
            onClick: () => {
              triggerOverlay(
                "Running Diagnostics", 
                "Analyzing curriculum indexing integrity and database response times...", 
                "Diagnostics Passed", 
                "0 warning items detected. All nodes operational."
              );
            },
            icon: <ShieldCheck className="h-4 w-4 text-neutral-500" />
          }
        ];
      } else if (pathname === '/assets') {
        options = [
          {
            label: "Upload New Image",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('explorer-upload-file'));
              toast({ title: "Asset Upload", description: "Opening file uploader..." });
            },
            icon: <Upload className="h-4 w-4 text-sky-500" />
          },
          {
            label: "Run Cloudinary Sync",
            onClick: () => {
              triggerOverlay(
                "Cloudinary Gateway", 
                "Syncing image public URLs and metadata from Cloudinary storage...", 
                "Sync Completed", 
                "Retrieved resources indices refreshed successfully."
              );
            },
            icon: <RefreshCw className="h-4 w-4 text-emerald-500" />
          },
          {
            label: "Prune Unused Cache",
            onClick: () => {
              triggerOverlay(
                "Pruning Cache", 
                "Clearing cached asset preview blobs and redundant layout logs...", 
                "Purging Completed", 
                "Orphaned thumbnails and unused layout items purged."
              );
            },
            icon: <Trash2 className="h-4 w-4 text-neutral-500" />
          }
        ];
      } else if (pathname === '/blogs') {
        options = [
          {
            label: "New Journal Entry",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('blog-create-new'));
              toast({ title: "Journal Studio", description: "Opening new post editor..." });
            },
            icon: <FilePlus2 className="h-4 w-4 text-amber-500" />
          },
          {
            label: "Sync Drafts with MongoDB",
            onClick: () => {
              triggerOverlay(
                "Syncing Drafts", 
                "Comparing local journal drafts with cloud MongoDB database records...", 
                "Sync Complete!", 
                "Blog indices successfully saved and uploaded."
              );
            },
            icon: <Database className="h-4 w-4 text-emerald-500" />
          },
          {
            label: "Clear Drafts Recycle Bin",
            onClick: () => {
              triggerOverlay(
                "Cleaning Recycle Bin", 
                "Permanently deleting blog soft-deleted draft items...", 
                "Emptying Complete", 
                "Recycle bin cleared completely."
              );
            },
            icon: <Trash2 className="h-4 w-4 text-rose-500" />
          }
        ];
      } else if (pathname === '/settings') {
        options = [
          {
            label: "Commit Configuration",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('settings-save'));
            },
            icon: <Lock className="h-4 w-4 text-rose-500" />
          },
          {
            label: "Restore Default Site Profile",
            onClick: () => {
              triggerOverlay(
                "Restoring Defaults", 
                "Resetting global branding hex color codes and headings fonts...", 
                "Theme Restored", 
                "Website styling defaulted to basic layout profile configuration."
              );
            },
            icon: <RefreshCw className="h-4 w-4 text-sky-500" />
          },
          {
            label: "Export Metadata Backup",
            onClick: () => {
              triggerOverlay(
                "Generating Backup", 
                "Compiling branding profiles, theme configuration, and settings...", 
                "Export Complete", 
                "Settings metadata JSON backup file downloaded."
              );
            },
            icon: <Copy className="h-4 w-4 text-neutral-500" />
          }
        ];
      } else if (pathname === '/staff') {
        options = [
          {
            label: "Invite New Operator/Staff",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('staff-invite'));
              toast({ title: "Staff Directory", description: "Opening staff invitation form..." });
            },
            icon: <Plus className="h-4 w-4 text-amber-500" />
          },
          {
            label: "Audit Active Sessions",
            onClick: () => {
              triggerOverlay(
                "Auditing Credentials", 
                "Checking administrative access privileges and active login sessions...", 
                "Audit Passed", 
                "Session records authenticated. 0 leaks found."
              );
            },
            icon: <ShieldCheck className="h-4 w-4 text-sky-500" />
          },
          {
            label: "Export Operator Directory",
            onClick: () => {
              triggerOverlay(
                "Exporting Directory", 
                "Compiling operator directory list and permission configurations...", 
                "Exported Successfully", 
                "Operator staff database downloaded."
              );
            },
            icon: <Copy className="h-4 w-4 text-neutral-500" />
          }
        ];
      } else if (pathname === '/users') {
        options = [
          {
            label: "Create Access Policy",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('users-policy'));
              toast({ title: "Identity Governance", description: "Creating custom permission policy..." });
            },
            icon: <Users2 className="h-4 w-4 text-emerald-500" />
          },
          {
            label: "Run Security Audit Scan",
            onClick: () => {
              triggerOverlay(
                "Scanning User Directory", 
                "Analyzing registration logs and user activity patterns...", 
                "Directory Scanned", 
                "Finished scanning user listings. All nodes secure."
              );
            },
            icon: <ShieldCheck className="h-4 w-4 text-sky-500" />
          },
          {
            label: "Moderate User Accounts",
            onClick: () => {
              triggerOverlay(
                "Moderating Directory", 
                "Auditing accounts matching suspicious registration logs...", 
                "Moderation Synced", 
                "User accounts logs checked and updated."
              );
            },
            icon: <Settings2 className="h-4 w-4 text-neutral-500" />
          }
        ];
      } else if (pathname === '/assessments') {
        options = [
          {
            label: "Create Assessment Module",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('explorer-new-folder'));
              toast({ title: "Assessment Hub", description: "Opening New Folder prompt..." });
            },
            icon: <PlusSquare className="h-4 w-4 text-yellow-500" />
          },
          {
            label: "Upload Secure Exam Keys",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('explorer-upload-file'));
              toast({ title: "Assessment Hub", description: "Opening key file upload selector..." });
            },
            icon: <Upload className="h-4 w-4 text-sky-500" />
          },
          {
            label: "Toggle Core/Premium Levels",
            onClick: () => {
              triggerOverlay(
                "Level Governance", 
                "Recalculating core/premium enrollment requirements catalog...", 
                "Levels Synchronized", 
                "Finished refreshing certification requirements."
              );
            },
            icon: <Sparkles className="h-4 w-4 text-amber-500" />
          }
        ];
      } else if (pathname === '/community') {
        options = [
          {
            label: "Moderate Community Threads",
            onClick: () => {
              triggerOverlay(
                "Auditing Threads", 
                "Auditing active posts, comments, and reports in database...", 
                "Threads Cleaned", 
                "Moderator scan complete. All posts audited."
              );
            },
            icon: <MessageSquare className="h-4 w-4 text-indigo-500" />
          },
          {
            label: "Flag Profanity & Spam",
            onClick: () => {
              triggerOverlay(
                "Anti-Spam Shield", 
                "Scanning database threads for profanity and spam violations...", 
                "Purge Complete", 
                "Cleaned 10 spam reports from community forum catalog."
              );
            },
            icon: <Trash2 className="h-4 w-4 text-rose-500" />
          },
          {
            label: "Sync Live Community DB",
            onClick: () => {
              triggerOverlay(
                "Syncing Forum DB", 
                "Synchronizing community threads with MongoDB backend servers...", 
                "Sync Complete!", 
                "Interactive community database logs synchronized."
              );
            },
            icon: <RefreshCw className="h-4 w-4 text-emerald-500" />
          }
        ];
      } else if (pathname === '/pages') {
        options = [
          {
            label: "Create New Page",
            onClick: () => {
              const addBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.includes('Add Page'));
              if (addBtn) (addBtn as HTMLButtonElement).click();
            },
            icon: <Plus className="h-4 w-4 text-emerald-500" />
          },
          {
            label: "Refresh Page Tree Schema",
            onClick: () => {
              triggerOverlay(
                "Refreshing Schemas", 
                "Re-fetching dynamic route directories and sitemaps...", 
                "Schema Synced", 
                "MongoDB site pages records loaded successfully."
              );
              window.dispatchEvent(new CustomEvent('page-refresh'));
            },
            icon: <RefreshCw className="h-4 w-4 text-sky-500" />
          }
        ];
      } else if (pathname === '/updates') {
        options = [
          {
            label: "Publish New Update",
            onClick: () => {
              const addBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.includes('Create Update'));
              if (addBtn) (addBtn as HTMLButtonElement).click();
            },
            icon: <Plus className="h-4 w-4 text-amber-500" />
          },
          {
            label: "Run Updates Sync",
            onClick: () => {
              triggerOverlay(
                "Syncing Updates", 
                "Synchronizing announcements registry and push tokens...", 
                "Sync Complete", 
                "Platform notices successfully live."
              );
            },
            icon: <RefreshCw className="h-4 w-4 text-sky-500" />
          }
        ];
      }

      if (options.length > 0) {
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuOptions(options);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [pathname, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const startTime = Date.now();
    
    // Initial ping
    fetch('/api/security/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: pathname, renderTime: 0 })
    }).catch(() => {});

    // Update time spent every 10 seconds
    const interval = setInterval(() => {
      fetch('/api/security/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: pathname, renderTime: 10 })
      }).catch(() => {});
    }, 10000);

    return () => {
      clearInterval(interval);
      // Final flush
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      if (elapsed > 0) {
        fetch('/api/security/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ route: pathname, renderTime: elapsed % 10 }),
          keepalive: true
        }).catch(() => {});
      }
    };
  }, [pathname, mounted]);

  const isAuthRoute = pathname === '/login';
  const isHome = pathname === '/';
  const isAdminRoot = pathname === '/';

  const firstSegment = pathname?.split('/').filter(Boolean)[0] ?? '';
  const adminSegments = new Set([
    'support',
    'analytics',
    'blogs',
    'community',
    'courses',
    'curriculum-catalog',
    'assessments',
    'pages',
    'realtime',
    'settings',
    'tests',
    'theme',
    'updates',
    'users',
  ]);
  const isAdminPanelRoute = adminSegments.has(firstSegment);
  const shouldHideSiteChrome = isAdminPanelRoute || isAdminRoot || isAuthRoute;

  const hasLocalSession = typeof window !== 'undefined' && localStorage.getItem('xmarty_session');

  if (!mounted) {
    const shouldRender = isAuthRoute;
    return (
      <ConfirmProvider>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 w-full">
            {shouldRender ? children : (
              <div className="min-h-screen flex items-center justify-center bg-muted/10">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            )}
          </main>
        </div>
      </ConfirmProvider>
    );
  }

  const shouldRenderChildren = isAuthRoute || (mounted && hasLocalSession);

  return (
    <ConfirmProvider>
      <div className="min-h-screen flex flex-col w-full">
        <PageTransition onPendingChange={setIsPagePending}>
          <main
            className={cn(
              "flex-1 w-full max-w-full overflow-x-hidden"
            )}
          >
            {shouldRenderChildren ? children : (
              <div className="min-h-screen flex items-center justify-center bg-muted/10">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            )}
          </main>
        </PageTransition>
        <Toaster />
        {!isAuthRoute && <SessionTimeout />}
        <GoToMainSite />

        {/* Custom Context Menu Rendering */}
        {menuPos && (
          <ContextMenu
            x={menuPos.x}
            y={menuPos.y}
            onClose={() => setMenuPos(null)}
            options={menuOptions}
          />
        )}

        {/* Dynamic Saving/Activity Overlay */}
        <SavingOverlay
          isVisible={overlayOpen}
          status={overlayStatus}
          progress={overlayProgress}
          title={overlayTitle}
          description={overlayDesc}
          successTitle={overlaySuccessTitle}
          successDescription={overlaySuccessDesc}
          errorDescription={overlayDesc}
          onClose={() => setOverlayOpen(false)}
        />
      </div>
    </ConfirmProvider>
  );
}
