
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
      const fetchProfileData = async () => {
        setIsLoadingData(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            reset({
              phone: data.phone || '',
              skills: data.skills ? data.skills.join(', ') : '',
              resumeUrl: data.resumeUrl || '',
            });
            setAppliedJobs(data.appliedJobs || []);
          } else {
            // No profile yet, form will have default empty values
             reset({ phone: '', skills: '', resumeUrl: '' }); // Ensure reset if no data
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
          toast({
            title: 'Error',
            description: 'Could not load your profile data. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchProfileData();
    }
  }, [user, reset, toast]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !user.uid) {
      toast({ title: 'Error', description: 'User not authenticated.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const profileDataToSave: UserProfile = {
        uid: user.uid,
        fullName: user.fullName || 'N/A', // From AuthContext
        email: user.email, // From AuthContext
        phone: data.phone || '',
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(s => s) : [],
        resumeUrl: data.resumeUrl || '',
        // appliedJobs are not updated here, only displayed
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), profileDataToSave, { merge: true });
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.',
      });
    } catch (error) {
      console.error("Error saving profile data:", error);
      toast({
        title: 'Error',
        description: 'Could not save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (authLoading || (!isAuthenticated && !user)) {
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
            {isLoadingData ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading profile...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <section className="space-y-6 p-6 rounded-lg border bg-muted/10 shadow-sm">
                  <h3 className="text-xl font-semibold flex items-center text-primary"><Edit3 className="mr-2 h-5 w-5"/>Edit Your Information</h3>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => <Input id="phone" placeholder="Your phone number" {...field} />}
                    />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="skills">Skills (comma-separated)</Label>
                    <Controller
                      name="skills"
                      control={control}
                      render={({ field }) => <Textarea id="skills" placeholder="e.g., React, Next.js, Node.js, Team Leadership" {...field} rows={3} />}
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
                        render={({ field }) => <Input id="resumeUrl" type="url" placeholder="https://linkedin.com/in/yourprofile/details/featured/your-resume.pdf" {...field} />}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Link to your online resume (e.g., Google Drive, LinkedIn, personal site).</p>
                    {errors.resumeUrl && <p className="text-sm text-destructive mt-1">{errors.resumeUrl.message}</p>}
                  </div>
                </section>
                
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Profile
                </Button>
              </form>
            )}

            <section className="mt-12 p-6 rounded-lg border bg-muted/10 shadow-sm">
              <h3 className="text-xl font-semibold flex items-center text-primary mb-4"><Briefcase className="mr-2 h-5 w-5"/>Applied Jobs</h3>
              {isLoadingData ? (
                 <div className="text-center text-muted-foreground">Loading applied jobs...</div>
              ) : appliedJobs.length > 0 ? (
                <ul className="space-y-2">
                  {appliedJobs.map((jobId, index) => (
                    <li key={index} className="text-muted-foreground p-2 border-b">
                      Applied to Job ID: {jobId} (Details placeholder)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">You haven't applied to any jobs yet through our new system, or we couldn't fetch your past applications.</p>
              )}
            </section>
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  );
}
