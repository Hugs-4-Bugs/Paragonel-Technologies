import { CodeXml } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-20 md:flex-row md:py-0 px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <CodeXml className="h-6 w-6 text-primary hidden md:inline neon-icon" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} QuantumLeap. All rights reserved.
          </p>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Innovate Your Future.
        </p>
      </div>
    </footer>
  );
}
