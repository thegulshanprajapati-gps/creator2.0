'use client';

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert, Save, Plus, Trash2, Copy, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const PERMISSION_KEYS = [
  { id: 'view_dashboard', label: 'View Dashboard Stats', description: 'Access dashboard and basic analytics counters' },
  { id: 'edit_courses', label: 'Manage Courses', description: 'Create, update, and delete course folders/materials' },
  { id: 'enroll_students', label: 'Student Enrollments', description: 'Enroll students, view student profiles and edit info' },
  { id: 'edit_blogs', label: 'Insight Journal CMS', description: 'Manage blogs/articles structure and editor' },
  { id: 'manage_tests', label: 'Test & Assessment Builder', description: 'Create and edit assessments, tests and files' },
  { id: 'view_security', label: 'View Security Audit Logs', description: 'Access compliance audit trailing logs' },
  { id: 'edit_settings', label: 'System Settings', description: 'Change site names, branding color schemes and configs' },
  { id: 'bypass_transactions', label: 'Bypass Gateway Rules', description: 'Allow modifications directly without forced transactions' },
];

export default function RolesMatrixPage() {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  // State for creating/editing custom role
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/settings/roles');
      const data = await res.json();
      if (data.success && data.roles) {
        setRoles(data.roles);
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Failed to load custom roles." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Role name is required." });
      return;
    }

    const isConfirmed = await confirm({
      title: editingRoleId ? "Update Custom Role" : "Create Custom Role",
      message: `Are you sure you want to save the "${roleName}" role configuration and apply its permissions matrix across the system?`,
      confirmText: "Apply Policy",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    setSaving(true);
    try {
      const res = await fetch('/api/settings/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName.trim().toLowerCase().replace(/\s+/g, '-'),
          description: roleDesc.trim(),
          permissions: selectedPermissions
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Role Policy Synchronized", description: `Role configuration stored and applied in MongoDB.` });
        setRoleName("");
        setRoleDesc("");
        setSelectedPermissions([]);
        setEditingRoleId(null);
        await fetchRoles();
      } else {
        throw new Error(data.error || 'Failed to save role');
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Operation Failed", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (role: any) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDesc(role.description || "");
    setSelectedPermissions(role.permissions || []);
  };

  const handleClone = (role: any) => {
    setEditingRoleId(null);
    setRoleName(`${role.name}-copy`);
    setRoleDesc(`Cloned copy of ${role.name}. ${role.description || ""}`);
    setSelectedPermissions([...(role.permissions || [])]);
    toast({ title: "Role Cloned", description: "Permissions matrix populated. Review and customize before saving." });
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 border-amber-200/40 dark:border-amber-500/10">
          <SidebarTrigger />
          <div>
            <h1 className="font-headline font-bold text-xl">Identity Permissions Matrix</h1>
            <p className="text-xs text-muted-foreground font-medium">Configure Granular Role-Based Access Control (RBAC) Policies</p>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Role List & Live Overview Matrix */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-amber-200/50 dark:border-amber-500/10 shadow-xl rounded-[2rem] bg-background">
              <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent border-b">
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" /> Active System Custom Roles
                </CardTitle>
                <CardDescription>View, edit, clone or audit existing access matrices matching user directories.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-muted rounded-2xl">
                    No custom roles defined yet. Use the panel on the right to configure policy layers.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {roles.map((role) => (
                      <div 
                        key={role.id} 
                        className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-500/20 transition-all duration-300"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm uppercase tracking-wider text-amber-600 dark:text-yellow-500 font-mono">
                              {role.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-bold">
                              {role.permissions?.length || 0} permissions
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{role.description || "No description provided."}</p>
                          
                          {/* Mini Permission Badges Grid */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {role.permissions?.map((p: string) => (
                              <span key={p} className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded font-mono">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0 w-full md:w-auto">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(role)}
                            className="text-xs font-bold rounded-xl h-9 flex-1 md:flex-initial"
                          >
                            Edit Matrix
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleClone(role)}
                            className="text-xs font-bold rounded-xl h-9 flex-1 md:flex-initial gap-1 border-sky-500/20 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          >
                            <Copy className="h-3 w-3" /> Clone
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Policy Definition Panel */}
          <div className="space-y-6">
            <Card className="border-amber-200/50 dark:border-amber-500/10 shadow-xl rounded-[2rem] bg-background">
              <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent border-b">
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-amber-500" />
                  {editingRoleId ? "Update Permission Matrix" : "Configure Custom Role Policy"}
                </CardTitle>
                <CardDescription>
                  {editingRoleId ? "Modifying existing role configuration." : "Define name and toggle specific permissions checkboxes."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveRole} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="role-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role Access Key</Label>
                    <Input 
                      id="role-name"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="e.g. content-manager"
                      className="rounded-xl h-11"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="role-desc" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Policy Description</Label>
                    <Input 
                      id="role-desc"
                      value={roleDesc}
                      onChange={(e) => setRoleDesc(e.target.value)}
                      placeholder="Explain role capabilities..."
                      className="rounded-xl h-11"
                    />
                  </div>

                  {/* Permissions matrix selection list */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Matrix Checkboxes</Label>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/50 overflow-hidden bg-slate-50/20 dark:bg-slate-900/10">
                      {PERMISSION_KEYS.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.id);
                        return (
                          <div 
                            key={perm.id} 
                            className="p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                          >
                            <Checkbox 
                              id={`perm-${perm.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPermissions(prev => [...prev, perm.id]);
                                } else {
                                  setSelectedPermissions(prev => prev.filter(x => x !== perm.id));
                                }
                              }}
                              className="mt-0.5"
                            />
                            <div className="space-y-0.5">
                              <Label 
                                htmlFor={`perm-${perm.id}`} 
                                className="text-xs font-bold cursor-pointer select-none text-slate-800 dark:text-slate-200"
                              >
                                {perm.label}
                              </Label>
                              <p className="text-[10px] text-muted-foreground leading-snug">{perm.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-850">
                    {editingRoleId && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setEditingRoleId(null);
                          setRoleName("");
                          setRoleDesc("");
                          setSelectedPermissions([]);
                        }}
                        className="rounded-xl flex-1 font-bold h-11"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex-1 flex items-center justify-center gap-1.5 h-11 shadow-md"
                    >
                      {saving ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Saving Matrix...</>
                      ) : (
                        <><Save className="h-4 w-4" /> Apply Policy</>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
