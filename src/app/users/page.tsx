'use client';

import { useEffect, useMemo, useState } from "react";
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

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  enrolledCourses?: string[];
  createdAt?: string;
}

// Fixed role options for the User Directory — exactly these 4 roles
const USER_ROLES = ['super_admin', 'admin', 'instructor', 'student'] as const;

export default function UsersAdminPage() {
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [activeMainSection, setActiveMainSection] = useState<string | null>(null);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('student');
  const [isCreating, setIsCreating] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await db.auth.getUser();
      if (user) {
        const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
        setCurrentUser({
          ...user,
          ...profile
        });
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await db.from('profiles').select('*').order('full_name', { ascending: true });
    if (error) {
      setError(error.message);
      setUsers([]);
    } else {
      const STAFF_ROLES = ['admin', 'super_admin', 'editor'];
      const filteredProfiles = (data || []).filter((profile: any) => !STAFF_ROLES.includes(profile.role));
      
      const usersData: AdminUser[] = filteredProfiles.map((profile: any) => ({
        id: profile.id,
        email: profile.email,
        name: profile.full_name || profile.name || 'Anonymous',
        role: profile.role || '',
        enrolledCourses: profile.enrolled_courses || [],
        createdAt: profile.created_at ? new Date(profile.created_at).toLocaleString() : 'Unknown',
      }));
      setUsers(usersData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();

    const handlePolicyTrigger = () => {
      setShowCreateForm(true);
    };
    window.addEventListener('users-policy', handlePolicyTrigger);
    return () => {
      window.removeEventListener('users-policy', handlePolicyTrigger);
    };
  }, []);

  const roleGroups = useMemo<string[]>(() => {
    return Array.from(new Set(users.map((user) => user.role || '')))
      .filter((role): role is string => Boolean(role))
      .sort();
  }, [users]);

  const changeRole = async (userId: string, newRole: string) => {
    const isSuperAdmin = currentUser?.email === 'admin@xmartycreator.com';
    if (!isSuperAdmin) {
      toast({ variant: 'destructive', title: 'Unauthorized', description: 'Only the Super Admin can modify roles!' });
      return;
    }

    setLoading(true);
    setError("");
    const { error } = await db.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      setError(error.message);
    } else {
      const STAFF_ROLES = ['admin', 'super_admin', 'editor'];
      if (STAFF_ROLES.includes(newRole)) {
        // Remove from local users state so they disappear instantly
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        toast({ title: 'Promoted to Staff', description: 'User has been moved to the Staff Console!' });
      } else {
        setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, role: newRole } : user));
        toast({ title: 'Success', description: 'User role updated successfully!' });
      }
    }
    setLoading(false);
  };

  const removeUser = async (userId: string) => {
    const isSuperAdmin = currentUser?.email === 'admin@xmartycreator.com';
    if (!isSuperAdmin) {
      toast({ variant: 'destructive', title: 'Unauthorized', description: 'Only the Super Admin can delete users!' });
      return;
    }

    const isConfirmed = await confirm({
      title: 'Delete User Profile',
      message: 'Delete user profile and associated role data? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!isConfirmed) return;
    
    setLoading(true);
    setError("");
    const { error } = await db.from('profiles').delete().eq('id', userId);
    if (error) {
      setError(error.message);
    } else {
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      toast({ title: 'Success', description: 'User profile deleted.' });
    }
    setLoading(false);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill in Name and Email!' });
      return;
    }
    setIsCreating(true);
    setError("");
    
    const userId = 'user_' + Math.random().toString(36).substring(2, 11);
    const newUserDoc = {
      id: userId,
      email: newUserEmail,
      full_name: newUserName,
      role: newUserRole,
      enrolled_courses: [],
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await db.from('profiles').insert(newUserDoc);
      if (error) throw new Error(error.message);
      
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('student');
      setShowCreateForm(false);
      await fetchUsers();
      toast({ title: 'Success', description: 'User registered successfully!' });
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsCreating(false);
    }
  };

  const isSuperAdmin = currentUser?.email === 'admin@xmartycreator.com';

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 border-amber-200/40 dark:border-amber-500/10">
          <SidebarTrigger />
          <div>
            <h1 className="font-headline font-bold text-xl text-slate-900 dark:text-white">User Directory</h1>
            <p className="text-xs text-muted-foreground">Manage student and teacher platform roles.</p>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <Card className="border-amber-200/50 dark:border-amber-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="font-headline">Access Directory</CardTitle>
                <CardDescription>Live user listings from database with role selectors.</CardDescription>
              </div>
              {isSuperAdmin && (
                <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-amber-500 hover:bg-amber-600 shadow-md text-white font-bold rounded-xl">
                  {showCreateForm ? 'Cancel' : 'Register / Add User'}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              
              {isSuperAdmin && showCreateForm && (
                <form onSubmit={createUser} className="mb-8 p-6 rounded-[2rem] border border-amber-200 dark:border-amber-500/20 bg-amber-500/[0.02] space-y-4">
                  <h3 className="font-headline text-lg font-bold text-amber-800 dark:text-yellow-400">Register New Member</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</label>
                      <input 
                        type="text" 
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="John Doe" 
                        className="w-full h-11 px-4 rounded-xl border bg-background focus:ring-1 focus:ring-amber-500 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</label>
                      <input 
                        type="email" 
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="john@example.com" 
                        className="w-full h-11 px-4 rounded-xl border bg-background focus:ring-1 focus:ring-amber-500 outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Role</label>
                         <Select value={newUserRole} onValueChange={(val) => setNewUserRole(val)}>
                           <SelectTrigger className="w-full h-11 px-4 rounded-xl border bg-background focus:ring-1 focus:ring-amber-500 outline-none">
                             <SelectValue placeholder="Select Role" />
                           </SelectTrigger>
                           <SelectContent>
                             {USER_ROLES.map((r) => (
                               <SelectItem key={r} value={r}>
                                 {r.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                    <Button type="submit" disabled={isCreating} className="bg-amber-500 hover:bg-amber-600 rounded-xl text-white font-bold">
                      {isCreating ? 'Creating Profile...' : 'Save Profile'}
                    </Button>
                  </div>
                </form>
              )}

              {error && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {roleGroups.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-muted-foreground">
                    No user roles found in the database.
                  </div>
                ) : (
                  roleGroups.map((roleKey) => {
                    const sectionUsers = users.filter((user) => user.role === roleKey);
                    return (
                      <div key={roleKey} className="border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden bg-background shadow-sm">
                        <button
                          onClick={() => setActiveMainSection(activeMainSection === roleKey ? null : roleKey)}
                          className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-muted/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-muted/10 flex items-center justify-center text-foreground border border-border">
                              <span className="text-sm uppercase font-bold">{roleKey.slice(0, 2)}</span>
                            </div>
                            <div>
                              <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white">{roleKey}</h3>
                              <p className="text-xs text-muted-foreground">{sectionUsers.length} {sectionUsers.length === 1 ? 'user' : 'users'} assigned to this role.</p>
                            </div>
                          </div>
                          <i className={`fa-solid ${activeMainSection === roleKey ? 'fa-chevron-up' : 'fa-chevron-down'} text-muted-foreground`} />
                        </button>

                        <AnimatePresence initial={false}>
                          {activeMainSection === roleKey && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden border-t border-slate-100 dark:border-white/5"
                            >
                              <div className="p-6">
                                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-background">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        {isSuperAdmin && <TableHead>Actions</TableHead>}
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {sectionUsers.map((user) => (
                                        <TableRow key={user.id}>
                                          <TableCell className="font-bold">{user.name}</TableCell>
                                          <TableCell>{user.email}</TableCell>
                                          <TableCell>
                                            <Select
                                              disabled={!isSuperAdmin}
                                              value={user.role}
                                              onValueChange={(val) => changeRole(user.id, val)}
                                            >
                                              <SelectTrigger className="w-32 h-9 text-xs">
                                                <SelectValue />
                                              </SelectTrigger>
                                             <SelectContent>
                                                {USER_ROLES.map((r) => (
                                                  <SelectItem key={r} value={r}>
                                                    {r.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </TableCell>
                                          <TableCell>{user.createdAt}</TableCell>
                                          {isSuperAdmin && (
                                            <TableCell>
                                              <Button size="sm" variant="destructive" onClick={() => removeUser(user.id)}>Delete</Button>
                                            </TableCell>
                                          )}
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>

            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
