
import { CodeXml } from "lucide-react";
import Link from "next/link";
import { NewsletterSubscription } from '@/components/sections/newsletter-subscription';

const footerNavLinks = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  // Add more or manage them if they become too many for a footer
];

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Logo and About */}
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <CodeXml className="h-8 w-8 text-primary neon-icon" />
              <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                QuantumLeap
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Innovate Your Future. QuantumLeap connects talent with innovation, shaping the future, one career at a time.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {footerNavLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Column 3: Contact Info - Can be expanded */}
           <div>
            <h4 className="font-semibold text-foreground mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>123 Innovation Drive, Tech City, CA</li>
              <li>Email: <a href="mailto:info@quantumleap.com" className="hover:text-primary">info@quantumleap.com</a></li>
              <li>Phone: <a href="tel:+1234567890" className="hover:text-primary">+1 (234) 567-890</a></li>
            </ul>
          </div>


          {/* Column 4: Newsletter */}
          <div className="lg:col-span-1">
             <h4 className="font-semibold text-foreground mb-4">Newsletter</h4>
             <NewsletterSubscription />
          </div>
        </div>
        
        <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between">
           <p className="text-sm text-muted-foreground text-center sm:text-left mb-4 sm:mb-0">
            &copy; {new Date().getFullYear()} QuantumLeap. All rights reserved.
          </p>
          <div className="flex space-x-4">
            {/* Placeholder for social media icons */}
            <Link href="#" className="text-muted-foreground hover:text-primary"><span className="sr-only">LinkedIn</span> {/* <Linkedin className="h-5 w-5" /> */ } L </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary"><span className="sr-only">Twitter</span> {/* <Twitter className="h-5 w-5" /> */ } T </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary"><span className="sr-only">Facebook</span> {/* <Facebook className="h-5 w-5" /> */ } F </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
