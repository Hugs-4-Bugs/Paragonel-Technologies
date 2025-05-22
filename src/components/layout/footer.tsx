
import Image from "next/image";
import Link from "next/link";
import { NewsletterSubscription } from '@/components/sections/newsletter-subscription';
import { Facebook, Linkedin, Twitter, Instagram } from 'lucide-react'; // Added Instagram

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
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Column 1: Logo and About */}
          <div className="md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image
                src="https://placehold.co/160x40.png"
                alt="QuantumFusion Solutions Logo"
                width={160}
                height={40}
                className="h-10 w-auto"
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
           <p className="text-sm text-muted-foreground text-center sm:text-left mb-4 sm:mb-0">
            &copy; {new Date().getFullYear()} QuantumFusion Solutions. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5 neon-icon" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
              <Twitter className="h-5 w-5 neon-icon" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
              <Facebook className="h-5 w-5 neon-icon" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
              <Instagram className="h-5 w-5 neon-icon" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
