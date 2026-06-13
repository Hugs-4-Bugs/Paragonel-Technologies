
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  BookOpen, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  ShieldCheck,
  Layers,
  Globe,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Users,
  Search,
  Mail,
  History,
  TrendingUp,
  FileUser
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const sidebarItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: FileUser },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/leads', label: 'Leads', icon: Mail },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/services', label: 'Services', icon: Layers },
  { href: '/admin/portfolio', label: 'Portfolio', icon: Globe },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Users },
  { href: '/admin/activity', label: 'Audit Logs', icon: History },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const isLoginPage = pathname === '/admin/login';

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      toast({ title: 'Logged Out', description: 'Session ended successfully.' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to logout.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden isolate">
      <style jsx global>{`
        header:not(.admin-header), footer:not(.admin-footer), .chat-widget { display: none !important; }
        main { padding-top: 0 !important; }
      `}</style>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-b z-[60] flex items-center justify-between px-4 admin-header shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">QuantumCMS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[55] bg-white dark:bg-zinc-900 border-r transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shrink-0",
        isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0",
        !isSidebarOpen && (isCollapsed ? "lg:w-20" : "lg:w-72")
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="h-16 flex items-center justify-between px-4 border-b shrink-0">
            <div className={cn("flex items-center gap-2 transition-all duration-300", isCollapsed && "lg:opacity-0 lg:w-0 overflow-hidden")}>
              <ShieldCheck className="h-7 w-7 text-primary shrink-0" />
              <span className="font-black text-xl tracking-tighter whitespace-nowrap">QuantumCMS</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden lg:flex h-8 w-8 text-zinc-400 hover:text-primary"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
          </div>

          <ScrollArea className="flex-1 py-6 px-3">
            {!isCollapsed && (
              <div className="px-3 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input 
                    placeholder="Global search..." 
                    className="pl-10 h-10 rounded-xl bg-zinc-50 border-none focus-visible:ring-1"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                  />
                </div>
              </div>
            )}

            <nav className="space-y-1.5">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 group",
                      isActive 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-primary",
                      isCollapsed && "lg:justify-center lg:px-0"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-primary")} />
                    <span className={cn("transition-all duration-300 whitespace-nowrap", isCollapsed && "lg:opacity-0 lg:w-0 lg:hidden")}>
                      {item.label}
                    </span>
                    {isActive && !isCollapsed && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t mt-auto shrink-0">
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-start text-destructive border-destructive/20 hover:text-destructive hover:bg-destructive/5 font-bold h-11 rounded-xl transition-all",
                isCollapsed && "lg:justify-center lg:px-0"
              )} 
              onClick={handleLogout}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="mr-3 h-5 w-5 shrink-0" />
              <span className={cn("transition-all duration-300 whitespace-nowrap", isCollapsed && "lg:opacity-0 lg:w-0 lg:hidden")}>
                Sign Out
              </span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ScrollArea className="flex-1 w-full h-full">
          <div className="w-full h-full p-4 md:p-8 lg:p-10 pt-20 lg:pt-10">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
