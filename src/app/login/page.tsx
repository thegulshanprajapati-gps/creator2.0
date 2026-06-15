'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ArrowRight, Loader2, Lock, LayoutDashboard, LogOut, AlertTriangle, Timer } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";

function AdminLoginForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const deniedReason = searchParams.get('reason');
  const sessionExpired = searchParams.get('reason') === 'session_expired';

  // ── Session check (from localStorage and server cookies if present) ──
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionStr = localStorage.getItem('xmarty_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          const role = session?.user?.role;
          if (role === 'super_admin' || role === 'admin' || role === 'editor') {
            console.log('already loggedin');
            setSessionUser(session.user);
            setCheckingSession(false);
            return;
          }
        }

        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        const hasToken = getCookie('xmarty_access_token');
        if (hasToken) {
          // Verify session from server (cookie-based)
          const res = await fetch('/api/auth/verify-domain', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            if (data.allowed && data.user) {
              setSessionUser(data.user);
            }
          }
        }
      } catch {}
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  // ── Lockout countdown ──
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, lockedUntil - Date.now());
      setLockCountdown(Math.ceil(remaining / 1000));
      if (remaining === 0) {
        setLockedUntil(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedUntil && Date.now() < lockedUntil) {
      toast({ variant: "destructive", title: "Locked", description: `Try again in ${lockCountdown}s` });
      return;
    }

    setLoading(true);
    const { data, error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
      // Check if the error message is about lockout
      const msg = error.message || '';
      if (msg.includes('temporarily locked') || msg.includes('Too many')) {
        // Extract retry time if available
        setLockedUntil(Date.now() + 15 * 60 * 1000);
      }
      toast({
        variant: "destructive",
        title: "Authorization Failed",
        description: msg,
      });
      setLoading(false);
      return;
    }

    const role = data?.user?.role;

    // Extra client-side check (backend already enforced this — defense in depth)
    if (role === 'instructor') {
      toast({
        variant: "destructive",
        title: "Wrong Portal",
        description: "Instructor accounts must use the Instructor Portal at port 5000.",
      });
      setLoading(false);
      return;
    }

    if (role === 'student') {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Student accounts cannot access the Admin Console.",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Authorization Successful",
      description: `Welcome to the Admin Console. Authenticated as ${role?.toUpperCase()}.`,
    });

    router.push('/');
    setTimeout(() => window.location.reload(), 100);
  };

  const handleLogout = async () => {
    await db.auth.signOut();
    localStorage.removeItem('xmarty_session');
    setSessionUser(null);
    toast({ title: "Signed Out", description: "Your administrative session has been terminated." });
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6 group">
            <div className="bg-primary p-3 rounded-2xl group-hover:rotate-12 transition-all shadow-xl shadow-primary/30 border-2 border-accent/20">
              <span className="text-white font-bold text-lg tracking-tighter">XC</span>
            </div>
            <span className="font-headline text-3xl font-bold tracking-tighter text-primary">
              XmartyCreator
            </span>
          </div>
          <h1 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em]">
            Support Engine Access
          </h1>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Admin · SuperAdmin · Editor Only</p>
        </div>

        {/* Session expired / denied banner — only show when NOT logged in */}
        <AnimatePresence>
          {!sessionUser && (sessionExpired || deniedReason) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {sessionExpired ? 'Session Expired' : 'Access Denied'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sessionExpired
                    ? 'Your session has expired. Please log in again.'
                    : 'You do not have permission to access this domain.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {sessionUser ? (
          <Card className="border-primary/10 shadow-2xl overflow-hidden bg-background/80 backdrop-blur-xl">
            <div className="h-2 w-full bg-amber-500" />
            <CardHeader className="space-y-2 p-8">
              <CardTitle className="text-2xl font-headline font-bold flex items-center gap-2 text-amber-600 dark:text-yellow-400">
                <ShieldCheck className="h-6 w-6" /> Authorized Access
              </CardTitle>
              <CardDescription className="text-sm">
                Active administrative session verified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-8 pt-0 text-center">
              <div className="p-4 rounded-xl border border-amber-200/50 bg-amber-500/[0.03] space-y-1">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Active Account</p>
                <p className="font-bold text-sm text-foreground">{sessionUser.email}</p>
                <Badge className="bg-amber-500 text-slate-950 font-bold uppercase text-[9px] mt-1">
                  {sessionUser.role?.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="rounded-xl h-11 text-xs font-bold border-rose-200/50 hover:bg-rose-500/10 text-rose-600 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="h-4 w-4" /> Log Out
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  className="rounded-xl h-11 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                >
                  <LayoutDashboard className="h-4 w-4" /> Console <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/10 shadow-2xl overflow-hidden bg-background/80 backdrop-blur-xl">
            <div className="h-2 w-full bg-primary" />
            <CardHeader className="space-y-2 p-8">
              <CardTitle className="text-3xl font-headline font-bold flex items-center gap-3 text-primary">
                <Lock className="h-7 w-7" /> Secure Entry
              </CardTitle>
              <CardDescription className="text-base font-medium">
                Authorized access only — Admin Console v2.0
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8 pt-0">
              {lockedUntil && Date.now() < lockedUntil ? (
                <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-center space-y-2">
                  <Timer className="h-8 w-8 text-rose-500 mx-auto" />
                  <p className="font-bold text-rose-600 dark:text-rose-400">Account Temporarily Locked</p>
                  <p className="text-sm text-muted-foreground">
                    Too many failed attempts. Try again in{' '}
                    <span className="font-mono font-bold text-rose-500">
                      {Math.floor(lockCountdown / 60)}:{String(lockCountdown % 60).padStart(2, '0')}
                    </span>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold">Admin Identifier</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@xmartycreator.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-2 focus:ring-primary rounded-xl"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-bold">Access Key</Label>
                      <Link href="#" className="text-xs text-primary font-bold hover:underline">System Recovery</Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-2 focus:ring-primary rounded-xl"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary h-14 text-lg font-bold shadow-xl shadow-primary/20 rounded-xl hover:scale-[1.02] transition-transform"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <>Authorize Console Access <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="bg-muted/30 p-6 flex flex-col items-center gap-2 border-t">
              <p className="text-[10px] text-muted-foreground flex items-center gap-2 font-bold uppercase tracking-widest">
                <ShieldCheck className="h-3 w-3 text-primary" /> RBAC v2 · CSRF Protected · httpOnly Session
              </p>
            </CardFooter>
          </Card>
        )}

        <div className="mt-10 text-center">
          <a
            href={process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000'}
            className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
          >
            Return to Public Platform
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}