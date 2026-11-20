"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { NewsletterSubscription } from '@/components/sections/newsletter-subscription';
import { Facebook, Linkedin, Twitter, Github, Settings, MapPin, Mail, Phone } from 'lucide-react';
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import { Button } from "@/components/ui/button";

const footerNavLinks = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/our-product", label: "Our Product" },
  { href: "/careers", label: "Careers" },
  { href: "/blog", label: "Blog" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  const { openSettings, isMounted } = useCookieConsent();
  const { resolvedTheme } = useTheme();
  const footerLogoSrc = resolvedTheme === "dark" ? "/images/logo4.png" : "/images/logo3.png";

  return (
    <footer className="border-t border-border/40 bg-background relative z-10">
      <div className="container px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Branding */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <Image
                src={footerLogoSrc}
                alt="Paragonel"
                width={180}
                height={60}
                className="h-auto w-auto dark:brightness-110"
                priority
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Paragonel Technologies Pvt. Ltd. — an AI-native product-engineering company. We build our own SaaS products, including AcquisitionOS, and deliver cloud, DevOps, AI, and product-engineering services.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                <MapPin className="h-4 w-4 text-primary" />
                <span>HSR Layout, Bangalore, 560102</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:contact@paragonel.com">contact@paragonel.com</a>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:+919663076023">+91 9663076023</a>
              </div>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="font-bold text-foreground mb-6 uppercase tracking-widest text-xs">Company</h4>
            <ul className="space-y-3">
              {footerNavLinks.slice(0, 5).map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Column 3: More Links */}
          <div>
            <h4 className="font-bold text-foreground mb-6 uppercase tracking-widest text-xs">Resources</h4>
             <ul className="space-y-3">
              {footerNavLinks.slice(5).map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/privacy-policy" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="space-y-6">
             <h4 className="font-bold text-foreground mb-2 uppercase tracking-widest text-xs">Join the Community</h4>
             <NewsletterSubscription />
          </div>
        </div>
        
        <div className="border-t border-border/40 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-x-6 gap-y-3 text-sm text-muted-foreground font-medium">
            <p>&copy; {new Date().getFullYear()} Paragonel.</p>
            {isMounted && (
              <button 
                onClick={openSettings} 
                className="flex items-center hover:text-primary transition-colors group"
              >
                <Settings className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-500" /> 
                Cookie Settings
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <Link
              href="https://www.linkedin.com/in/prabhat-kumar-6963661a4/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-all hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </Link>
            <Link
              href="https://x.com/kattyPrabhat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-all hover:scale-110"
              aria-label="X (Twitter)"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="https://github.com/Hugs-4-Bugs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-all hover:scale-110"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
