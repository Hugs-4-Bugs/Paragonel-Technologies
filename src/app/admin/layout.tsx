"use client";

import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const sidebarItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">QuantumCMS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-zinc-900 border-r transform transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center gap-2 px-6 border-b">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight">QuantumCMS</span>
          </div>

          <ScrollArea className="flex-1 py-6 px-4">
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t mt-auto">
            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5" 
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
