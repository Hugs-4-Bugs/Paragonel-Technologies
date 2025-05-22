
"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CodeXml, Menu, X } from "lucide-react"; // Using a generic tech icon

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/team", label: "Team" },
  { href: "/careers", label: "Careers" },
  { href: "/blog", label: "Blog" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <CodeXml className="h-7 w-7 text-primary neon-icon" />
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            QuantumLeap
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.slice(0, 5).map((link) => ( // Show first 5 links, rest can be in a dropdown or footer for desktop if too many
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
           {/* Example for more links dropdown - not fully implemented here to keep it concise */}
          {navLinks.length > 5 && (
             <Link
                href="/contact" // Or a dedicated "More" page
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                More... 
              </Link>
          )}
          <ThemeToggleButton />
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
                    <CodeXml className="h-7 w-7 text-primary neon-icon" />
                    <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                      QuantumLeap
                    </span>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-1 p-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
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
