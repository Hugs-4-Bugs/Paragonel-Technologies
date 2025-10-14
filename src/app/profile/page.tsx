
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
// import { db } from '@/lib/firebase';
// import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCircle, Save, Briefcase, LinkIcon, Edit3 } from 'lucide-react';
import type { UserProfile } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

const profileSchema = z.object({
  phone: z.string().optional(),
  skills: z.string().optional(), // Comma-separated string from textarea
  resumeUrl: z.string().url({ message: "Please enter a valid URL for your resume." }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: '',
      skills: '',
      resumeUrl: '',
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/profile');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && user.uid) {
      // ** FIREBASE DISABLED **
      // The original Firebase project was deleted.
      // This function is disabled until a new project is configured.
      console.log("Firebase functionality is disabled. Skipping profile fetch.");
      setIsLoadingData(false);
      // const fetchProfileData = async () => {
      //   setIsLoadingData(true);
      //   try {
      //     const userDocRef = doc(db, 'users', user.uid);
      //     const docSnap = await getDoc(userDocRef);
      //     if (docSnap.exists()) {
      //       const data = docSnap.data() as UserProfile;
      //       reset({
      //         phone: data.phone || '',
      //         skills: data.skills ? data.skills.join(', ') : '',
      //         resumeUrl: data.resumeUrl || '',
      //       });
      //       setAppliedJobs(data.appliedJobs || []);
      //     } else {
      //       reset({ phone: '', skills: '', resumeUrl: '' });
      //     }
      //   } catch (error) {
      //     console.error("Error fetching profile data:", error);
      //     toast({
      //       title: 'Error',
      //       description: 'Could not load your profile data. Please try again.',
      //       variant: 'destructive',
      //     });
      //   } finally {
      //     setIsLoadingData(false);
      //   }
      // };
      // fetchProfileData();
    } else if (!authLoading && !user) {
      setIsLoadingData(false);
    }
  }, [user, authLoading, reset, toast]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !user.uid) {
      toast({ title: 'Error', description: 'User not authenticated.', variant: 'destructive' });
      return;
    }
    // ** FIREBASE DISABLED **
    toast({
        title: "Profile Saving Disabled",
        description: "The Firebase project has been deleted, so profile changes cannot be saved.",
        variant: "destructive"
    });
    // setIsSaving(true);
    // try {
    //   const profileDataToSave: Partial<UserProfile> = {
    //     uid: user.uid,
    //     fullName: user.fullName || 'N/A',
    //     email: user.email,
    //     phone: data.phone || '',
    //     skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(s => s) : [],
    //     resumeUrl: data.resumeUrl || '',
    //     updatedAt: serverTimestamp(),
    //   };

    //   await setDoc(doc(db, 'users', user.uid), profileDataToSave, { merge: true });
    //   toast({
    //     title: 'Profile Updated',
    //     description: 'Your profile information has been saved successfully.',
    //   });
    // } catch (error) {
    //   console.error("Error saving profile data:", error);
    //   toast({
    //     title: 'Error',
    //     description: 'Could not save your profile. Please try again.',
    //     variant: 'destructive',
    //   });
    // } finally {
    //   setIsSaving(false);
    // }
  };
  
  if (authLoading || (!isAuthenticated && !user && typeof window !== 'undefined')) {
    return (
      <div className="section-padding flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="section-padding bg-background">
      <ScrollArea className="container mx-auto max-w-3xl px-4 md:px-6">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <UserCircle className="mx-auto h-20 w-20 text-primary mb-4 neon-icon" />
            <CardTitle className="text-3xl md:text-4xl">{user?.fullName || 'Your Profile'}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">{user?.email}</CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            <Alert variant="destructive" className="mb-8">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Firebase Disconnected</AlertTitle>
                <AlertDescription>
                    The original Firebase project for this app was deleted. Profile data cannot be loaded or saved. To fix this, create a new Firebase project and update the environment variables.
                </AlertDescription>
            </Alert>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <section className="space-y-6 p-6 rounded-lg border bg-muted/10 shadow-sm opacity-50 cursor-not-allowed">
                  <h3 className="text-xl font-semibold flex items-center text-primary"><Edit3 className="mr-2 h-5 w-5"/>Edit Your Information</h3>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => <Input id="phone" placeholder="Your phone number" {...field} disabled />}
                    />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="skills">Skills (comma-separated)</Label>
                    <Controller
                      name="skills"
                      control={control}
                      render={({ field }) => <Textarea id="skills" placeholder="e.g., React, Next.js, Node.js, Team Leadership" {...field} rows={3} disabled />}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Enter your skills separated by commas.</p>
                    {errors.skills && <p className="text-sm text-destructive mt-1">{errors.skills.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="resumeUrl">Resume URL (Optional)</Label>
                     <div className="flex items-center space-x-2">
                        <LinkIcon className="h-5 w-5 text-muted-foreground" />
                        <Controller
                        name="resumeUrl"
                        control={control}
                        render={({ field }) => <Input id="resumeUrl" type="url" placeholder="https://linkedin.com/in/yourprofile/details/featured/your-resume.pdf" {...field} disabled />}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Link to your online resume (e.g., Google Drive, LinkedIn, personal site).</p>
                    {errors.resumeUrl && <p className="text-sm text-destructive mt-1">{errors.resumeUrl.message}</p>}
                  </div>
                </section>
                
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile (Disabled)
                </Button>
              </form>

            <section className="mt-12 p-6 rounded-lg border bg-muted/10 shadow-sm">
              <h3 className="text-xl font-semibold flex items-center text-primary mb-4"><Briefcase className="mr-2 h-5 w-5"/>Applied Jobs</h3>
              <p className="text-muted-foreground">This feature is disabled because the Firebase database is disconnected.</p>
            </section>
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  );
}
