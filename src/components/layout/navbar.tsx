"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, ChevronDown, LogIn, UserPlus, LogOut, UserCircle, Settings2, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context"; 

const mainNavLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
];

const moreNavLinks = [
  { href: "/team", label: "Team" },
  { href: "/careers", label: "Careers" },
  { href: "/blog", label: "Blog" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

type NavLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
  action?: () => void;
};

const authNavLinksBase: NavLink[] = [
  { href: "/auth/login", label: "Login", icon: LogIn },
  { href: "/auth/signup", label: "Sign Up", icon: UserPlus },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, isLoading } = useAuth(); 

  const getMobileNavLinks = (): NavLink[] => {
    if (isLoading) return []; 
    
    let links: NavLink[] = [...mainNavLinks, ...moreNavLinks];
    if (isAuthenticated && user) {
      // Check if user is the admin
      if (user.email === 'admin@paragonel.com') {
        links.push({ href: "/admin", label: "Admin CMS", icon: Shield });
      }
      links.push({ href: "/profile", label: "My Profile", icon: UserCircle });
      links.push({ href: "#", label: "Logout", icon: LogOut, action: () => { logout(); setIsMobileMenuOpen(false); } });
    } else {
      links.push(...authNavLinksBase);
    }
    return links;
  };

  const allNavLinksForMobile = getMobileNavLinks();

  const getUserInitial = () => {
    if (user?.fullName) return user.fullName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2 mb-0 -ml-6">
          <div className="relative h-20 w-[200px] md:h-24 md:w-[220px]">
            <Image
              src="/images/logo3.png"
              alt="Paragonel Logo"
              width={2172}
              height={724}
              className="h-full w-full object-contain dark:hidden"
              data-ai-hint="company logo abstract"
              priority
            />
            <Image
              src="/images/logo4.png"
              alt="Paragonel Logo"
              width={2172}
              height={724}
              className="hidden h-full w-full object-contain dark:block"
              data-ai-hint="company logo abstract"
              priority
            />
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {mainNavLinks.map((link) => (
            <Button variant="link" asChild key={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary px-2 lg:px-3">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          {moreNavLinks.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="link" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary px-2 lg:px-3">
                  More <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {moreNavLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="w-full justify-start">
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="flex items-center space-x-2 pl-3">
            {isLoading ? (
              <div className="h-9 w-32 bg-muted animate-pulse rounded-md"></div> 
            ) : isAuthenticated && user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{getUserInitial()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.fullName || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.email === 'admin@paragonel.com' && (
                      <DropdownMenuItem asChild>
                         <Link href="/admin" className="cursor-pointer font-bold text-primary">
                           <Shield className="mr-2 h-4 w-4" />
                           Admin Panel
                         </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                       <Link href="/profile" className="cursor-pointer">
                         <Settings2 className="mr-2 h-4 w-4" />
                         My Profile
                       </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" asChild size="sm">
                    <Link href="/auth/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login
                    </Link>
                </Button>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/auth/signup">
                         <UserPlus className="mr-2 h-4 w-4" />
                        Sign Up
                    </Link>
                </Button>
              </>
            )}
            <ThemeToggleButton />
          </div>
        </nav>

        <div className="md:hidden flex items-center">
          <ThemeToggleButton />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm p-0">
              <SheetHeader className="p-6 border-b">
                <SheetTitle className="flex items-center justify-between">
                  <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                    Paragonel
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-1 p-6">
                {isLoading && <p className="text-muted-foreground p-3">Loading...</p>}
                {!isLoading && allNavLinksForMobile.map((link) => (
                  <Button
                    variant="ghost"
                    asChild={!link.action} 
                    key={link.href + (link.label || '')} 
                    className="justify-start px-3 py-2.5 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      if (link.action) {
                        link.action();
                      }
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {link.action ? (
                      <div className="flex items-center w-full">
                        {link.icon && <link.icon className="mr-3 h-5 w-5 text-primary" />}
                        {link.label}
                      </div>
                    ) : (
                      <Link href={link.href} className="flex items-center w-full">
                        {link.icon && <link.icon className="mr-3 h-5 w-5 text-primary" />}
                        {link.label}
                      </Link>
                    )}
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
