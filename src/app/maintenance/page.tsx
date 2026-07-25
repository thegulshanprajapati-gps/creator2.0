'use client';

import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Construction, RefreshCw, Power, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PageSetting {
  route: string;
  label: string;
  enabled: boolean;
  updatedAt: string | null;
}

export default function MaintenancePage() {
  const [pages, setPages] = useState<PageSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/maintenance');
      if (res.ok) {
        setPages(await res.json());
      }
    } catch (e) {
      console.error('Failed to load maintenance settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    document.title = "Maintenance Control | Xmarty Creator";
  }, []);

  const toggleMaintenance = async (route: string, currentEnabled: boolean) => {
    setToggling(route);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route, enabled: !currentEnabled }),
      });
      if (res.ok) {
        setPages(prev => prev.map(p =>
          p.route === route ? { ...p, enabled: !currentEnabled, updatedAt: new Date().toISOString() } : p
        ));
        toast({
          title: !currentEnabled ? '🚧 Maintenance ON' : '✅ Page Restored',
          description: `${route} is now ${!currentEnabled ? 'under maintenance' : 'live'}`,
        });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update maintenance status' });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Network Error', description: 'Could not reach server' });
    } finally {
      setToggling(null);
    }
  };

  const activeCount = pages.filter(p => p.enabled).length;

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-background">
          {/* Header */}
          <header className="flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Construction className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-white">Maintenance Control</h1>
                <p className="text-xs text-slate-500">Toggle page availability for users</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {activeCount > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    {activeCount} page{activeCount > 1 ? 's' : ''} under maintenance
                  </span>
                </div>
              )}
              <button
                onClick={() => { setLoading(true); fetchSettings(); }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
            {/* Info Banner */}
            <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-4 flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-blue-500" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">How it works</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Toggling a page ON puts it in maintenance mode — visitors see a maintenance screen while the URL stays the same.
                  Admins with an active session bypass maintenance and can still access the page normally.
                  Changes take effect within ~30 seconds (cache TTL).
                </p>
              </div>
            </div>

            {/* Pages Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pages.map((page) => (
                  <div
                    key={page.route}
                    className={`relative rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all duration-300 ${
                      page.enabled
                        ? 'bg-amber-500/5 border-amber-500/30 shadow-sm shadow-amber-500/10'
                        : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Left */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {page.enabled ? (
                          <Construction className="h-4 w-4 text-amber-500 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{page.label}</span>
                      </div>
                      <code className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {page.route}
                      </code>
                      {page.updatedAt && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(page.updatedAt).toLocaleString('en-IN', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </div>
                      )}
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleMaintenance(page.route, page.enabled)}
                      disabled={toggling === page.route}
                      className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
                        page.enabled
                          ? 'bg-amber-500 shadow-md shadow-amber-500/30'
                          : 'bg-slate-200 dark:bg-slate-700'
                      } ${toggling === page.route ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={page.enabled ? 'Click to restore' : 'Click to enable maintenance'}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${
                          page.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
