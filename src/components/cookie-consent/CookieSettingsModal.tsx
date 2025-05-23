
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
import { ShieldCheck, Settings, BarChart2, Megaphone, Sparkles } from "lucide-react";

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
    title: 'Essential Cookies',
    description: 'These cookies are necessary for the website to function properly. They include cookies for user authentication, session management, and security. They cannot be disabled.',
    icon: ShieldCheck,
    isEssential: true,
  },
  {
    id: 'functional',
    title: 'Functional Cookies',
    description: 'These cookies enhance website functionality and personalization, such as remembering your theme preferences or form inputs for a smoother experience.',
    icon: Sparkles,
  },
  {
    id: 'analytics',
    title: 'Analytics Cookies',
    description: 'These cookies help us understand how visitors interact with our website by collecting anonymous data. This allows us to improve site performance and user experience.',
    icon: BarChart2,
  },
  {
    id: 'marketing',
    title: 'Marketing Cookies',
    description: 'These cookies are used to track visitors across websites to display relevant and engaging advertisements. They may be set by us or third-party advertising partners.',
    icon: Megaphone,
  },
];

export function CookieSettingsModal() {
  const { isMounted, showSettingsModal, preferences, savePreferences, closeSettings, setPreferences: updateLivePreferences } = useCookieConsent();

  if (!isMounted) {
    return null;
  }

  const handleToggle = (category: CookieCategory, checked: boolean) => {
    updateLivePreferences(prev => ({ ...prev, [category]: checked }));
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
            Changes will be saved when you click "Save Preferences".
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
