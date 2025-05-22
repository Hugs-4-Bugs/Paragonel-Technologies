"use client";

import Link from "next/link";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { CodeXml } from "lucide-react"; // Using a generic tech icon

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <CodeXml className="h-7 w-7 text-primary neon-icon" />
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            QuantumLeap
          </span>
        </Link>
        <ThemeToggleButton />
      </div>
    </header>
  );
}
