
"use client"; // Add "use client" because openSettings will be a client-side interaction

import Image from "next/image";
import Link from "next/link";
import { NewsletterSubscription } from '@/components/sections/newsletter-subscription';
import { Facebook, Linkedin, Twitter, Instagram, Settings } from 'lucide-react';
import { useCookieConsent } from "@/hooks/use-cookie-consent.tsx"; // Import the hook
import { Button } from "@/components/ui/button"; // Import Button for the settings link


const footerNavLinks = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/team", label: "Team" },
  { href: "/careers", label: "Careers" },
  { href: "/blog", label: "Blog" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  const { openSettings, isMounted } = useCookieConsent();

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Column 1: Logo and About */}
          <div className="md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image
                src="/images/QuantumFusion-Logo.png" 
                alt="QuantumFusion Solutions Logo"
                width={220}
                height={150}
                className="h-20 w-30 md:h-40 md:w-40, align-center, rounded-3xl"
                data-ai-hint="company logo abstract"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              QuantumFusion Solutions: Shaping the future for tomorrow with innovative IT solutions in AI, Cloud, DevOps, and SaaS.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {footerNavLinks.slice(0, 5).map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
           {/* Column 3: More Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 lg:invisible">‎</h4> {/* Placeholder for alignment */}
             <ul className="space-y-2">
              {footerNavLinks.slice(5).map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>


          {/* Column 4: Newsletter */}
          <div className="md:col-span-2 lg:col-span-1">
             <h4 className="font-semibold text-foreground mb-4">Stay Connected</h4>
             <NewsletterSubscription />
          </div>
        </div>
        
        <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2 text-sm text-muted-foreground text-center sm:text-left mb-4 sm:mb-0">
            <p>
              &copy; {new Date().getFullYear()} QuantumFusion Solutions. All rights reserved.
            </p>
            {isMounted && (
              <Button variant="link" size="sm" onClick={openSettings} className="p-0 text-muted-foreground hover:text-primary">
                <Settings className="h-4 w-4 mr-1.5" /> Cookie Settings
              </Button>
            )}
          </div>
          <div className="flex space-x-4">
            <Link href="https://www.linkedin.com/company/quantumfusion-solutions/?viewAsMember=true" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5 neon-icon" />
            </Link>
            <Link href="https://x.com/kattyPrabhat" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
              <Twitter className="h-5 w-5 neon-icon" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
              <Facebook className="h-5 w-5 neon-icon" />
            </Link>
            <Link href="https://www.instagram.com/_s_4_sharma/" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
              <Instagram className="h-5 w-5 neon-icon" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
