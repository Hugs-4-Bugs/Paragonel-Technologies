
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, ChevronDown, LogIn, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const authNavLinks = [
  { href: "/auth/login", label: "Login", icon: LogIn },
  { href: "/auth/signup", label: "Sign Up", icon: UserPlus },
];

// Combined for mobile menu
const allNavLinksForMobile = [...mainNavLinks, ...moreNavLinks, ...authNavLinks];


export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="https://placehold.co/160x40.png" 
            alt="QuantumFusion Solutions Logo"
            width={160}
            height={40}
            className="h-10 w-auto md:h-12"
            data-ai-hint="company logo abstract"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
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
            <ThemeToggleButton />
          </div>
        </nav>

        {/* Mobile Navigation Trigger */}
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
                     <Image
                        src="https://placehold.co/150x38.png"
                        alt="QuantumFusion Solutions Logo Mobile"
                        width={150}
                        height={38}
                        className="h-9 w-auto"
                        data-ai-hint="company logo abstract mobile"
                      />
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-1 p-6">
                {allNavLinksForMobile.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2.5 rounded-md text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      {link.icon && <link.icon className="mr-3 h-5 w-5 text-primary" />}
                      {link.label}
                    </div>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
