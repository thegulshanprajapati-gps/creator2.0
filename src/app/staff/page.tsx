'use client';

import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";

interface StaffUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  createdAt: string;
}

// Fixed role options for Staff Console — exactly these 3 roles
const STAFF_ROLES = ['admin', 'super_admin', 'editor', 'instructor'] as const;

export default function StaffAdminPage() {
  const confirm = useConfirm();
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [currentUser, setCurrentUser] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('admin');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await db.auth.getUser();
      if (user) {
        const { data: profile } = await db.from('profiles').select('*').eq('email', user.email).single();
        setCurrentUser({
          ...user,
          ...profile
        });
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await db.from('profiles').select('*').order('full_name', { ascending: true });
    if (error) {
      setError(error.message);
      setStaffList([]);
    } else {
      const profiles = (data || []) as Record<string, any>[];
      const filtered = profiles.filter((profile) => STAFF_ROLES.includes(profile.role));
      setStaffList(filtered.map((profile: Record<string, any>) => ({
        id: profile.id || profile._id,
        email: profile.email,
        name: profile.full_name || profile.name || '',
        phone: profile.phone || '',
        role: profile.role || '',
        createdAt: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '',
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchStaff();

    const handleInviteTrigger = () => {
      setShowCreateForm(true);
    };
    window.addEventListener('staff-invite', handleInviteTrigger);
    return () => {
      window.removeEventListener('staff-invite', handleInviteTrigger);
    };
  }, []);

  const isSuperAdmin = currentUser?.email === 'admin@xmartycreator.com';

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role || !password) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Name, Email, Password, and Role are required.' });
      return;
    }
    
    setIsCreating(true);
    setError("");

    const staffId = 'staff_' + Math.random().toString(36).substring(2, 11);
    const newStaffDoc = {
      id: staffId,
      email,
      full_name: name,
      phone: phone || '',
      role,
      password,
      enrolled_courses: [],
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await db.from('profiles').insert(newStaffDoc);
      if (error) throw new Error(error.message);

      setName('');
      setEmail('');
      setPhone('');
      setRole('admin');
      setPassword('');
      setShowCreateForm(false);
      await fetchStaff();
      toast({ title: 'Success', description: 'Staff member registered successfully!' });
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsCreating(false);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) {
      toast({ variant: 'destructive', title: 'Unauthorized', description: 'Only the Super Admin can modify staff roles.' });
      return;
    }

    setLoading(true);
    const { error } = await db.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      setError(error.message);
    } else {
      await fetchStaff();
    }
    setLoading(false);
  };

  const removeStaff = async (userId: string) => {
    if (!isSuperAdmin) {
      toast({ variant: 'destructive', title: 'Unauthorized', description: 'Only the Super Admin can delete staff members.' });
      return;
    }

    const isConfirmed = await confirm({
      title: 'Remove Staff Member',
      message: 'Are you sure you want to remove this staff member?',
      confirmText: 'Remove',
      cancelText: 'Cancel'
    });
    if (!isConfirmed) return;
    
    setLoading(true);
    const { error } = await db.from('profiles').delete().eq('id', userId);
    if (error) {
      setError(error.message);
    } else {
      await fetchStaff();
    }
    setLoading(false);
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6 border-amber-200/40 dark:border-amber-500/10">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <h1 className="font-headline font-bold text-xl text-amber-900 dark:text-yellow-400">Staff Console</h1>
              <p className="text-xs text-muted-foreground">Manage administrative roles (Admin, Editor, Super Admin).</p>
            </div>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs">
              {showCreateForm ? 'Cancel Registration' : 'Add Staff Member'}
            </Button>
          )}
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <AnimatePresence>
            {isSuperAdmin && showCreateForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-amber-200 dark:border-amber-900/60 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-yellow-400">
                      Register Administrative Staff
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Newly registered staff will have access to the orchestration studio according to their role privileges.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleCreateStaff} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block ml-1">Full Name</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Alex Mercer"
                            className="w-full h-10 px-3 rounded-lg border bg-background text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block ml-1">Email Address</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="alex@xmartycreator.com"
                            className="w-full h-10 px-3 rounded-lg border bg-background text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block ml-1">Phone Number</label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 0199"
                            className="w-full h-10 px-3 rounded-lg border bg-background text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block ml-1">Access Password</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Set Password"
                            className="w-full h-10 px-3 rounded-lg border bg-background text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block ml-1">Role</label>
                           <Select value={role} onValueChange={(val) => setRole(val)}>
                             <SelectTrigger className="w-full h-10 rounded-lg border bg-background text-xs focus:ring-1 focus:ring-amber-500 outline-none">
                               <SelectValue placeholder="Select Role" />
                             </SelectTrigger>
                             <SelectContent>
                               {STAFF_ROLES.map((r) => (
                                 <SelectItem key={r} value={r}>
                                   {r.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                        <Button type="submit" disabled={isCreating} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4">
                          {isCreating ? 'Creating Profile...' : 'Save Profile'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
              {error}
            </div>
          )}

          <Card className="border-amber-200/50 dark:border-amber-500/10">
            <CardHeader className="bg-muted/10">
              <CardTitle className="font-headline text-base">Active Staff Members</CardTitle>
              <CardDescription className="text-xs">
                List of authenticated administrators and editors with system privileges.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-amber-900/30">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold">Staff User</TableHead>
                      <TableHead className="text-xs font-bold">Email</TableHead>
                      <TableHead className="text-xs font-bold">Phone Number</TableHead>
                      <TableHead className="text-xs font-bold">Role</TableHead>
                      <TableHead className="text-xs font-bold">Joined</TableHead>
                      {isSuperAdmin && <TableHead className="text-xs font-bold text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-bold text-xs">{user.name}</TableCell>
                        <TableCell className="text-xs">{user.email}</TableCell>
                        <TableCell className="text-xs">{user.phone}</TableCell>
                        <TableCell className="text-xs">
                           <Select
                             disabled={!isSuperAdmin || user.email === 'admin@xmartycreator.com'}
                             value={user.role}
                             onValueChange={(val) => changeRole(user.id, val)}
                           >
                             <SelectTrigger className="w-36 h-8 text-xs font-semibold uppercase">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               {STAFF_ROLES.map((r) => (
                                 <SelectItem key={r} value={r}>
                                   {r.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                        </TableCell>
                        <TableCell className="text-xs">{user.createdAt}</TableCell>
                        {isSuperAdmin && (
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-8 text-[10px] font-bold"
                              disabled={user.email === 'admin@xmartycreator.com'} 
                              onClick={() => removeStaff(user.id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
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
