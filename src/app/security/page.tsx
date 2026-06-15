'use client';

import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  RefreshCw, 
  Search, 
  Clock, 
  FileWarning,
  ChevronDown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action_type: string;
  target_entity: string;
  target_id: string;
  timestamp: string;
  ip_address: string;
  browser_info: string;
  domain: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

interface CustomDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}

function CustomDropdown({ value, onChange, options, placeholder }: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const handleClose = () => setOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [open]);

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-background flex items-center justify-between text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 mt-1.5 bg-background border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 py-1 overflow-hidden max-h-60 overflow-y-auto"
          >
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${
                  opt.value === value ? 'bg-primary/5 text-primary font-bold' : 'text-foreground/85'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SecurityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [domainFilter, setDomainFilter] = useState<string>('ALL');

  const severityOptions = [
    { label: 'All Severities', value: 'ALL' },
    { label: 'Critical', value: 'CRITICAL' },
    { label: 'High / Error', value: 'ERROR' },
    { label: 'Warning', value: 'WARNING' },
    { label: 'Info', value: 'INFO' },
  ];

  const domainOptions = [
    { label: 'All Domains', value: 'ALL' },
    { label: 'Support Domain', value: 'supportdomain' },
    { label: 'Instructor Domain', value: 'instructordomain' },
    { label: 'Main Domain', value: 'maindomain' },
  ];

  const fetchAuthAndLogs = async () => {
    setLoading(true);
    try {
      const authRes = await fetch('/api/auth/verify-domain');
      if (authRes.ok) {
        const authData = await authRes.json();
        setCurrentUser(authData.user);
      }

      const query = new URLSearchParams();
      if (searchTerm) query.set('search', searchTerm);
      if (severityFilter !== 'ALL') query.set('severity', severityFilter);
      if (domainFilter !== 'ALL') query.set('domain', domainFilter);

      const logsRes = await fetch(`/api/audit-logs?${query.toString()}`);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      } else {
        throw new Error('Failed to load audit logs.');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Fetch Error', description: e.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthAndLogs();
  }, [searchTerm, severityFilter, domainFilter]);

  const getSeverityBadgeColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800';
      case 'ERROR':
        return 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800';
      case 'WARNING':
        return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800';
      case 'INFO':
      default:
        return 'bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:border-zinc-800';
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10 relative">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background/60 backdrop-blur-xl px-6 border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-50">
          <SidebarTrigger />
          <div className="flex-1 min-w-0">
            <h1 className="font-headline font-bold text-xl">Enterprise Audit Trail</h1>
            <p className="text-xs text-muted-foreground">Real-time system telemetry and modification controls monitor.</p>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <Badge variant="outline" className="font-bold text-[10px] uppercase py-1 px-2.5">
                Role: {currentUser.role}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={fetchAuthAndLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
            </Button>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 z-10 relative">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Threat Status</CardTitle>
                <ShieldAlert className="h-5 w-5 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-rose-600">
                  {logs.filter(l => l.severity === 'CRITICAL' || l.severity === 'ERROR').length} Severe
                </div>
                <p className="text-xs text-muted-foreground mt-1">Critical & high errors logged</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Active Trace</CardTitle>
                <Terminal className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-amber-600">
                  {logs.length} Logged
                </div>
                <p className="text-xs text-muted-foreground mt-1">Telemetry events captured</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Compliance Health</CardTitle>
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-emerald-600">100%</div>
                <p className="text-xs text-muted-foreground mt-1">Database Connected</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-4 !overflow-visible z-35 relative">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Search actor, action, entity..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div className="relative z-50">
                <CustomDropdown
                  value={severityFilter}
                  onChange={setSeverityFilter}
                  options={severityOptions}
                  placeholder="All Severities"
                />
              </div>

              <div className="relative z-50">
                <CustomDropdown
                  value={domainFilter}
                  onChange={setDomainFilter}
                  options={domainOptions}
                  placeholder="All Domains"
                />
              </div>
            </div>
          </Card>

          <Card className="rounded-[1.5rem] border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-sm">
            <CardHeader className="bg-primary/[0.02] border-b border-slate-100 dark:border-slate-850">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" /> Security Audit Streams
              </CardTitle>
              <CardDescription className="text-xs">
                Showing {logs.length} events matching current filter selections.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Actor / Role</TableHead>
                      <TableHead>Incident Action Type</TableHead>
                      <TableHead>Client IP / Browser</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length > 0 ? (
                      logs.map(log => (
                        <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="pl-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-sm text-foreground">
                                {log.actor_name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono bg-muted py-0.5 px-1.5 rounded-md font-normal w-fit">
                                {log.actor_role}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-xs font-bold text-amber-600 dark:text-yellow-400">
                                {log.action_type}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Target: {log.target_entity} ({log.target_id})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-mono">{log.ip_address}</span>
                              <span className="text-[10px] text-muted-foreground max-w-xs truncate" title={log.browser_info}>
                                {log.browser_info}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-full font-bold text-[9px] uppercase border px-2 py-0.5 ${getSeverityBadgeColor(log.severity)}`}>
                              {log.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          <FileWarning className="h-10 w-10 mx-auto opacity-20 mb-2 animate-bounce" />
                          No audit entries found matching the filter query.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
