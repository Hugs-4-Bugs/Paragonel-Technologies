
"use client";

import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/hooks/use-cookie-consent.tsx";
import { Cookie, Settings, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function CookieConsentBanner() {
  const { isMounted, showBanner, acceptAll, rejectNonEssential, openSettings } = useCookieConsent();

  if (!isMounted || !showBanner) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[200] p-4 md:p-6 bg-background/90 dark:bg-card/95 backdrop-blur-md shadow-2xl border-t border-border/50",
        "transform transition-transform duration-500 ease-out",
        showBanner ? "translate-y-0" : "translate-y-full"
      )}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie Consent Banner"
      aria-describedby="cookie-consent-description"
    >
      <div className="container mx-auto flex flex-col gap-4">
        {/* Text Block */}
        <div className="text-sm text-foreground">
          <div className="flex items-center mb-2">
            <Cookie className="h-6 w-6 mr-2 text-primary neon-icon" />
            <h2 className="text-lg font-semibold">Our Cookie Policy</h2>
          </div>
          <p id="cookie-consent-description" className="text-muted-foreground leading-relaxed">
            We use cookies to enhance your experience, analyze site traffic, and for marketing purposes.
            You can customize your preferences or accept all cookies. Essential cookies are always active for site functionality.
          </p>
        </div>

        {/* Button Group */}
        {/* 
          - flex flex-col sm:flex-row: Buttons stack vertically on small screens, go horizontal on 'sm' and up.
          - gap-3: Spacing between buttons.
          - sm:justify-end: On 'sm' screens and up (when horizontal), align the buttons to the right.
          - w-full: The button group div itself takes full width to allow justify-end to work correctly.
        */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end w-full">
          <Button
            onClick={acceptAll}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Accept All
          </Button>
          <Button
            onClick={rejectNonEssential}
            variant="outline"
            className="w-full sm:w-auto"
            size="lg"
          >
             <XCircle className="mr-2 h-5 w-5" />
            Reject Non-Essential
          </Button>
          <Button
            onClick={openSettings}
            variant="outline"
            className="w-full sm:w-auto"
            size="lg"
          >
            <Settings className="mr-2 h-5 w-5" />
            Customize
          </Button>
        </div>
      </div>
    </div>
  );
}
