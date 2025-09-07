
// "use client";

// import Link from "next/link";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { MailQuestion, ArrowLeft } from "lucide-react";
// import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";

// const forgotPasswordSchema = z.object({
//   email: z.string().email({ message: "Please enter a valid email address." }),
// });

// type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// export default function ForgotPasswordPage() {
//   const form = useForm<ForgotPasswordFormValues>({
//     resolver: zodResolver(forgotPasswordSchema),
//     defaultValues: {
//       email: "",
//     },
//   });

//   function onSubmit(values: ForgotPasswordFormValues) {
//     console.log("Forgot password form submitted:", values);
//     // Here you would typically call your backend API to send a reset link
//     alert("If an account with this email exists, a password reset link has been sent (simulated). Check console for data.");
//     form.reset();
//   }

//   return (
//     <div className="section-padding bg-background flex items-center justify-center min-h-[calc(100vh-10rem)]">
//       <ScrollFadeIn className="w-full max-w-md">
//         <Card className="shadow-xl">
//           <CardHeader className="text-center">
//             <MailQuestion className="mx-auto h-12 w-12 text-primary mb-4 neon-icon" />
//             <CardTitle className="text-3xl">Forgot Password?</CardTitle>
//             <CardDescription>
//               Enter your email address and we'll send you a link to reset your password (simulation).
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//                 <FormField
//                   control={form.control}
//                   name="email"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Email Address</FormLabel>
//                       <FormControl>
//                         <Input type="email" placeholder="your.email@example.com" {...field} />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//                 <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
//                   Send Reset Link
//                 </Button>
//               </form>
//             </Form>
//           </CardContent>
//           <CardFooter className="text-center text-sm">
//              <Button variant="link" asChild className="p-0 text-primary mx-auto">
//                 <Link href="/auth/login">
//                   <ArrowLeft className="mr-2 h-4 w-4" /> Back to Log In
//                 </Link>
//               </Button>
//           </CardFooter>
//         </Card>
//       </ScrollFadeIn>
//     </div>
//   );
// }












"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MailQuestion, ArrowLeft, Loader2 } from "lucide-react";
import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";
import { useToast } from "@/hooks/use-toast";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log("Forgot password form submitted:", values);
    
    // Replace alert with a toast notification
    toast({
      title: "Password Reset Link Sent",
      description: "If an account with this email exists, a password reset link has been sent to your inbox.",
    });

    form.reset();
    setIsSubmitting(false);
  }

  return (
    <div className="section-padding bg-background flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <ScrollFadeIn className="w-full max-w-md">
        <Card 
          className="rounded-[2.5rem] bg-background-neumorphic p-4 transform-gpu transition-all duration-700 
                     shadow-card-3d hover:shadow-2xl hover:scale-[1.03] 
                     hover:rotate-x-3 hover:rotate-y-5 perspective-1000"
        >
          <CardHeader className="text-center mb-2">
            <MailQuestion className="mx-auto h-20 w-20 text-primary mb-2 animate-pulse-light neon-icon" />
            <CardTitle className="text-3xl font-extrabold tracking-tight drop-shadow-md">Forgot Password?</CardTitle>
            <CardDescription className="text-muted-foreground mt-1 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-foreground">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your.email@example.com" 
                          className="rounded-2xl border-none shadow-soft-inset bg-background focus:ring-4 focus:ring-offset-2 focus:ring-primary focus:shadow-soft-inset-active transition-all duration-300 p-4 text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-lg font-bold 
                             shadow-soft-out hover:shadow-soft-out-hover transform transition-all duration-300 
                             hover:scale-[1.02] hover:bg-primary/95 active:shadow-soft-inset-active"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Send Reset Link'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="text-center text-sm mt-2">
             <Button variant="link" asChild className="p-0 text-base text-primary mx-auto hover:text-primary/70">
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Log In
                </Link>
              </Button>
          </CardFooter>
        </Card>
      </ScrollFadeIn>
    </div>
  );
}
