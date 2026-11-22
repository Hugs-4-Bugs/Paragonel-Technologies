"use client";

import Image from "next/image";
import Link from "next/link";
import { NewsletterSubscription } from '@/components/sections/newsletter-subscription';
import { Linkedin, Twitter, Github, Settings, MapPin, Mail, Phone, ArrowRight } from 'lucide-react';
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import { Button } from "@/components/ui/button";

/**
 * Footer (Phase 2 §6). Complete company footer: brand + positioning + verified
 * contact, Services links (the 4 categories), Product links, Company links,
 * a meaningful final CTA band, and a bottom legal bar. Logo theme switch:
 * logo3.png (light) / logo4.png (dark) — verified assets, same as the header.
 *
 * Contact details are the founder-supplied, verified values
 * (HSR Layout Bangalore, contact@paragonel.com, +91 9663076023) — not invented.
 * Social links are the founder-provided accounts used as Paragonel's presence;
 * none are invented.
 */
const servicesLinks = [
  { href: "/services/ai-solutions", label: "AI Solutions" },
  { href: "/services/custom-software", label: "Custom Software Development" },
  { href: "/services/cloud-devops", label: "Cloud & DevOps" },
  { href: "/services/data-analytics", label: "Data & Analytics" },
];

const productLinks = [
  { href: "/our-product", label: "Our Product" },
  { href: "/our-product/acquisitionos", label: "AcquisitionOS (Private Beta)" },
  { href: "/testimonials", label: "Selected Work" },
];

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  const { openSettings, isMounted } = useCookieConsent();

  return (
    <footer className="border-t border-border bg-background">
      {/* Final CTA band */}
      <div className="border-b border-border bg-secondary/40 dark:bg-secondary/15">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-10 text-center md:flex-row md:px-6 md:text-left">
          <div className="max-w-xl">
            <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">Have a project in mind?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Tell us the problem. We will scope it against your actual process and come back with an approach.</p>
          </div>
          <Button asChild size="lg" className="shrink-0 rounded-md">
            <Link href="/contact">Start a conversation <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 space-y-5">
            <Link href="/" className="inline-flex items-center">
              {/* Same two-image light/dark swap as the header (logo3 light /
                  logo4 dark). Identical asset + dimensions + object-contain —
                  no brightness filter — so the footer logo is visually the
                  same as the header in both themes. */}
              <div className="relative h-20 w-[200px] md:h-24 md:w-[220px]">
                <Image
                  src="/images/logo3.png"
                  alt="Paragonel"
                  width={2172}
                  height={724}
                  className="h-full w-full object-contain dark:hidden"
                  priority
                />
                <Image
                  src="/images/logo4.png"
                  alt="Paragonel"
                  width={2172}
                  height={724}
                  className="hidden h-full w-full object-contain dark:block"
                  priority
                />
              </div>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Paragonel Technologies Pvt. Ltd. — an AI-native product-engineering company. We build our own
              software, including AcquisitionOS, and deliver AI, cloud, DevOps, and product-engineering services
              that solve practical business problems.
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>HSR Layout, Bangalore, 560102, India</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:contact@paragonel.com" className="hover:text-primary transition-colors">contact@paragonel.com</a>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+919663076023" className="hover:text-primary transition-colors">+91 9663076023</a>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">Services</h4>
            <ul className="space-y-2.5">
              {servicesLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">{l.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/services" className="text-sm font-medium text-primary transition-colors hover:underline">All services →</Link>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">Product</h4>
            <ul className="space-y-2.5">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">Company</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">{l.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/privacy-policy" className="text-sm text-muted-foreground transition-colors hover:text-primary">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground transition-colors hover:text-primary">Terms &amp; Conditions</Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-sm text-muted-foreground transition-colors hover:text-primary">Cookie Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter (narrow, centered) */}
        <div className="mt-12 max-w-md">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-foreground">Engineering notes</h4>
          <NewsletterSubscription />
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-5 border-t border-border pt-6 sm:flex-row">
          <div className="flex flex-col items-center gap-x-5 gap-y-2 text-sm text-muted-foreground sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Paragonel Technologies Pvt. Ltd.</p>
            {isMounted && (
              <button
                onClick={openSettings}
                className="flex items-center transition-colors hover:text-primary"
              >
                <Settings className="mr-1.5 h-4 w-4" /> Cookie Settings
              </button>
            )}
          </div>

          <div className="flex items-center gap-5">
            <Link href="https://www.linkedin.com/in/prabhat-kumar-6963661a4/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-all hover:scale-110 hover:text-primary" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </Link>
            <Link href="https://x.com/kattyPrabhat" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-all hover:scale-110 hover:text-primary" aria-label="X (Twitter)">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="https://github.com/Hugs-4-Bugs" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-all hover:scale-110 hover:text-primary" aria-label="GitHub">
              <Github className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
