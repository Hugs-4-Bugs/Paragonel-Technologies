
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCookieConsent, type CookiePreferences, type CookieCategory } from "@/hooks/use-cookie-consent";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Settings, BarChart2, Megaphone, Sparkles, Gauge } from "lucide-react"; // Added Gauge

interface CookieCategoryDetail {
  id: CookieCategory | 'essential';
  title: string;
  description: string;
  icon: React.ElementType;
  isEssential?: boolean;
}

const cookieCategoriesDetails: CookieCategoryDetail[] = [
  {
    id: 'essential',
    title: 'Strictly Necessary Cookies',
    description: 'These cookies are strictly necessary for the website to function properly. They enable core functionalities such as authentication, session management, security, theme preference, and remembering your cookie consent. They cannot be disabled. Paragonel uses these.',
    icon: ShieldCheck,
    isEssential: true,
  },
  {
    id: 'functional',
    title: 'Functional Cookies',
    description: 'Would allow the website to remember choices you make (such as language or theme) for enhanced, personal features. Not currently used by Paragonel — no functional cookies or scripts are loaded. Your preference here will be recorded for if/when such a feature is added.',
    icon: Sparkles,
  },
  {
    id: 'performance',
    title: 'Performance Cookies',
    description: 'Would collect anonymous data on page-load speed to help optimize the site. Not currently used by Paragonel — no performance/RUM scripts are loaded. Your preference here will be recorded for if/when such a feature is added.',
    icon: Gauge,
  },
  {
    id: 'analytics',
    title: 'Analytics Cookies',
    description: 'Would collect anonymized, aggregated information about how visitors use the website. Not currently used by Paragonel — no analytics (e.g. Google Analytics) scripts are loaded. Your preference here will be recorded for if/when analytics is added.',
    icon: BarChart2,
  },
  {
    id: 'marketing',
    title: 'Marketing & Advertising Cookies',
    description: 'Would track browsing activity across websites to show relevant advertising. Not currently used by Paragonel — no marketing or advertising (e.g. Meta Pixel) scripts are loaded, and Paragonel does not sell personal data to advertisers. Your preference here will be recorded for if/when such a feature is added.',
    icon: Megaphone,
  },
];

export function CookieSettingsModal() {
  const { isMounted, showSettingsModal, preferences, savePreferences, closeSettings, setPreferences: updateLivePreferences } = useCookieConsent();

  if (!isMounted) {
    return null;
  }

  const handleToggle = (category: CookieCategory, checked: boolean) => {
    updateLivePreferences((prev: CookiePreferences) => ({ ...prev, [category]: checked }));
  };

  const handleSave = () => {
    savePreferences(preferences);
  };

  return (
    <Dialog open={showSettingsModal} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-2xl flex items-center">
            <Settings className="h-6 w-6 mr-2 text-primary neon-icon" />
            Customize Cookie Preferences
          </DialogTitle>
          <DialogDescription>
            Manage your cookie settings below. Essential cookies are always active.
            Changes will be saved when you click &quot;Save Preferences&quot;.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-6">
          <div className="space-y-6">
            {cookieCategoriesDetails.map((category) => (
              <div key={category.id} className="p-4 border rounded-lg bg-muted/20 dark:bg-muted/10">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor={`cookie-${category.id}`} className="flex items-center text-lg font-semibold text-foreground">
                    <category.icon className="h-5 w-5 mr-2 text-primary" />
                    {category.title}
                  </Label>
                  {category.isEssential ? (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full">Always Active</span>
                  ) : (
                    <Switch
                      id={`cookie-${category.id}`}
                      checked={preferences[category.id as CookieCategory]}
                      onCheckedChange={(checked) => handleToggle(category.id as CookieCategory, checked)}
                      aria-label={`Toggle ${category.title}`}
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 border-t gap-3">
          <Button variant="outline" onClick={closeSettings} size="lg">
            Cancel
          </Button>
          <Button onClick={handleSave} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
