'use client';

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Settings, 
  FileEdit, 
  BookOpen, 
  Users, 
  MessageSquare, 
  Bell, 
  Globe, 
  Image,
  BarChart,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Sun,
  Moon,
  Plug,
  Trash2,
  ClipboardList,
  Award,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import NextLink from 'next/link';
import { useCMS } from "@/components/cms-provider";
import { db } from "@/lib/db";
import useTheme from '@/hooks/use-theme';

const MENU_ITEMS = [
  { group: "Analytics", items: [
    { label: "System Overview", icon: LayoutDashboard, href: "/" },
    { label: "Performance", icon: BarChart, href: "/analytics" },
    { label: "Realtime Load", icon: Smartphone, href: "/realtime" },
    { label: "Traffic Monitor", icon: BarChart, href: "/settings/traffic" },
  ]},
  { group: "Orchestration Studio", items: [
    { label: "Pages CMS", icon: Globe, href: "/pages" },
    { label: "Curriculum Catalog", icon: BookOpen, href: "/curriculum-catalog" },
    { label: "Insight Journal", icon: FileEdit, href: "/blogs" },
    { label: "Insight Comments", icon: MessageSquare, href: "/blogs/comments" },
    { label: "Asset Library", icon: Image, href: "/assets" },
    { label: "Platform Updates", icon: Bell, href: "/updates" },
    { label: "Certificate Template", icon: Award, href: "/certificate-template" },
    { label: "Recycle Bin", icon: Trash2, href: "/recycle-bin" },
  ]},
  { group: "Identity & Ops", items: [
    { label: "Staff", icon: ShieldCheck, href: "/staff" },
    { label: "User Access", icon: Users, href: "/users" },
    { label: "Student Enrollments", icon: Users, href: "/enrollments" },
    { label: "Notification Panel", icon: Bell, href: "/notifications" },
    { label: "Role Matrix", icon: ShieldCheck, href: "/settings/roles" },
    { label: "Assessments", icon: ShieldCheck, href: "/assessments" },
    { label: "Test Builder", icon: ClipboardList, href: "/tests" },
    { label: "Student Reports", icon: BarChart, href: "/assessments/student-reports" },
    { label: "Allotted Certificates", icon: ShieldCheck, href: "/assessments/certificates" },
    { label: "Hub Interactions", icon: MessageSquare, href: "/community" },
  ]},
  { group: "Core Engine", items: [
    { label: "Service Connections", icon: Plug, href: "/connections" },
    { label: "System Settings", icon: Settings, href: "/settings" },
    { label: "Security Center", icon: ShieldCheck, href: "/security" },
  ]}
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { settings, refreshSettings } = useCMS();
  const { theme: localTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
    const fetchUser = async () => {
      try {
        const { data: { user } } = await db.auth.getUser();
        if (user) {
          const { data: profile } = await db.from('profiles').select('*').eq('email', user.email).single();
          setCurrentUser({
            ...user,
            ...profile
          });
        }
      } catch (e) {
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const toggleTheme = async () => {
    const nextMode = localTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextMode);

    try {
      const payload = {
        site_name: settings?.siteName || 'XmartyCreator',
        theme_settings: { themeMode: nextMode },
      };

      if (settings?.id) {
        db.from('site_settings').update(payload).eq('id', settings.id).catch(() => {});
      } else {
        db.from('site_settings').insert(payload).catch(() => {});
      }
      refreshSettings().catch(() => {});
    } catch (error) {
      console.error('Failed to save theme setting', error);
    }
  };

  React.useEffect(() => {
    if (settings?.themeMode) setTheme(settings.themeMode);
  }, [settings?.themeMode, setTheme]);

  const userRole = currentUser?.role || 'super_admin';

  // Filter links dynamically based on role permissions
  const filteredMenuItems = MENU_ITEMS.map(group => {
    if (userRole === 'editor') {
      if (group.group !== 'Orchestration Studio') return null;
      const allowedItems = group.items.filter(item => 
        ["Pages CMS", "Curriculum Catalog", "Insight Journal", "Insight Comments"].includes(item.label)
      );
      return { ...group, items: allowedItems };
    }
    if (userRole === 'admin') {
      const allowedItems = group.items.filter(item => item.label !== "Staff");
      return { ...group, items: allowedItems };
    }
    return group;
  }).filter(Boolean) as typeof MENU_ITEMS;

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r-0 bg-gradient-to-b from-indigo-50/80 to-slate-50/20 dark:from-indigo-950/20 dark:to-transparent border-indigo-200/50 dark:border-indigo-500/20">
      <SidebarHeader className="border-b h-16 flex items-center px-4 bg-transparent border-indigo-200/50 dark:border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xs tracking-tighter">XC</span>
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-headline font-bold text-base leading-tight text-indigo-900 dark:text-indigo-400">Xmarty Support</span>
            <span className="text-[10px] text-indigo-700 dark:text-indigo-500 uppercase tracking-widest font-bold">Admin Console</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-6 bg-transparent">
        {isLoadingUser ? (
          <div className="space-y-6 px-4 animate-pulse">
            {[1, 2, 3].map((g) => (
              <div key={g} className="space-y-3">
                <div className="h-3 w-24 bg-indigo-200/50 dark:bg-indigo-800/30 rounded" />
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-10 w-full bg-indigo-100/50 dark:bg-indigo-900/20 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          filteredMenuItems.map((group) => (
            <SidebarGroup key={group.group} className="mb-4">
              <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-700/80 dark:text-indigo-500 group-data-[collapsible=icon]:hidden">
                {group.group}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className={cn(
                            "transition-all duration-300 rounded-xl h-11 px-4 font-bold text-sm",
                            isActive 
                              ? "bg-indigo-500/20 text-indigo-950 dark:text-indigo-300 border border-indigo-500/30 shadow-sm" 
                              : "text-indigo-800/80 hover:text-indigo-900 dark:text-indigo-400/80 dark:hover:text-indigo-300 hover:bg-indigo-500/10"
                          )}
                        >
                          <NextLink href={item.href}>
                            <item.icon className={cn("w-4 h-4 text-indigo-600 dark:text-indigo-500", isActive ? "text-indigo-900 dark:text-indigo-300" : "")} />
                            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                            {isActive && <ChevronRight className="ml-auto w-3 h-3 group-data-[collapsible=icon]:hidden text-indigo-700 dark:text-indigo-500" />}
                          </NextLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t bg-transparent border-indigo-200/50 dark:border-indigo-500/20">
        <div className="space-y-2">
          <SidebarMenuButton
            className="hover:bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 group-data-[collapsible=icon]:justify-center h-12 rounded-xl font-bold"
            onClick={toggleTheme}
          >
            {mounted ? (
              localTheme === "dark" ? (
                <Sun className="w-4 h-4 text-indigo-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )
            ) : (
              <span className="w-4 h-4 inline-block" />
            )}
            <span className="group-data-[collapsible=icon]:hidden">
              Switch to {mounted ? (localTheme === "dark" ? "Light" : "Dark") : "..."}
            </span>
          </SidebarMenuButton>

          <SidebarMenuButton 
            className="text-rose-600 hover:bg-rose-500/10 group-data-[collapsible=icon]:justify-center h-12 rounded-xl font-bold"
            onClick={async () => {
              try {
                await db.auth.signOut();
                await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
              } catch (e) {}
              window.location.href = '/';
            }}
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span className="group-data-[collapsible=icon]:hidden">Exit Orchestration</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
