
// "use client"; 

// import Link from "next/link";
// import React, { useState, useEffect, Suspense } from "react"; // Added React and Suspense
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
// import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";
// import { useAuth } from "@/contexts/auth-context";
// import { useToast } from "@/hooks/use-toast";
// import { useRouter, useSearchParams } from 'next/navigation';

// const loginSchema = z.object({
//   email: z.string().email({ message: "Please enter a valid email address." }),
//   password: z.string().min(1, { message: "Password is required." }),
// });

// type LoginFormValues = z.infer<typeof loginSchema>;

// // Inner component that uses useSearchParams
// function LoginPageContent() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const { login } = useAuth();
//   const { toast } = useToast(); // useToast can be called here as it's a client component
//   const router = useRouter();
//   const searchParams = useSearchParams(); 

//   const form = useForm<LoginFormValues>({
//     resolver: zodResolver(loginSchema),
//     defaultValues: {
//       email: "",
//       password: "",
//     },
//   });

//   async function onSubmit(values: LoginFormValues) {
//     setIsSubmitting(true);
//     // In a real app, you'd await an API call
//     // For simulation, AuthContext.login is synchronous
//     login(values.email, values.password); 
    
//     // This part might not be reached if login redirects immediately
//     // For robust API calls, set isSubmitting to false in a .finally() block
//     setIsSubmitting(false); 
//   }

//   // Example: Reading a 'redirectUrl' from searchParams, though not used by AuthContext currently for redirection
//   useEffect(() => {
//     const redirect = searchParams.get('redirectUrl');
//     if (redirect) {
//       console.log("Login page: Redirect URL from params:", redirect);
//       // You could store this and use it in AuthContext if needed for more complex redirect logic
//     }
//   }, [searchParams]);

//   return (
//     <ScrollFadeIn className="w-full max-w-md">
//       <Card className="shadow-xl">
//         <CardHeader className="text-center">
//           <LogIn className="mx-auto h-12 w-12 text-primary mb-4 neon-icon" />
//           <CardTitle className="text-3xl">Welcome Back</CardTitle>
//           <CardDescription>Log in to your QuantumFusion Solutions account.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//               <FormField
//                 control={form.control}
//                 name="email"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Email Address</FormLabel>
//                     <FormControl>
//                       <Input type="email" placeholder="your.email@example.com" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="password"
//                 render={({ field }) => (
//                   <FormItem>
//                     <div className="flex justify-between items-center">
//                       <FormLabel>Password</FormLabel>
//                       <Button variant="link" asChild className="p-0 text-xs text-primary">
//                         <Link href="/auth/forgot-password">Forgot Password?</Link>
//                       </Button>
//                     </div>
//                     <FormControl>
//                       <div className="relative">
//                         <Input type={showPassword ? "text" : "password"} placeholder="********" {...field} />
//                          <Button
//                           type="button"
//                           variant="ghost"
//                           size="icon"
//                           className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
//                           onClick={() => setShowPassword(!showPassword)}
//                         >
//                           {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                         </Button>
//                       </div>
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
//                 {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Log In'}
//               </Button>
//             </form>
//           </Form>
//         </CardContent>
//         <CardFooter className="text-center text-sm">
//           <p className="text-muted-foreground w-full">
//             Don't have an account?{" "}
//             <Button variant="link" asChild className="p-0 text-primary">
//               <Link href="/auth/signup">Sign Up</Link>
//             </Button>
//           </p>
//         </CardFooter>
//       </Card>
//     </ScrollFadeIn>
//   );
// }

// // Simple loading spinner component for Suspense fallback
// function LoadingSpinner() {
//   return (
//     <div className="flex items-center justify-center min-h-[200px]">
//       <Loader2 className="h-12 w-12 animate-spin text-primary" />
//     </div>
//   );
// }

// // Main page component
// export default function LoginPage() {
//   return (
//     <div className="section-padding bg-background flex items-center justify-center min-h-[calc(100vh-10rem)]">
//       <Suspense fallback={<LoadingSpinner />}>
//         <LoginPageContent />
//       </Suspense>
//     </div>
//   );
// }







"use client"; 

import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    login(values.email, values.password); 
    setIsSubmitting(false); 
  }

  useEffect(() => {
    const redirect = searchParams.get('redirectUrl');
    if (redirect) {
      console.log("Login page: Redirect URL from params:", redirect);
    }
  }, [searchParams]);

  return (
    <ScrollFadeIn className="w-full max-w-md">
      {/* Increased shadows and added a more dynamic hover effect */}
      <Card 
        className="rounded-[2.0rem] bg-background-light p-4 transform-gpu transition-all duration-700 
                   shadow-card-3d hover:shadow-2xl hover:scale-[1.03] 
                   hover:rotate-x-3 hover:rotate-y-5 perspective-1000"
      >
        <CardHeader className="text-center mb-2">
          <LogIn className="mx-auto h-20 w-20 text-primary mb-2 animate-pulse-light neon-icon" /> {/* Larger icon, more prominent animation */}
          <CardTitle className="text-3xl text-foreground font-extrabold tracking-tight drop-shadow-md">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground mt-1 text-sm">Log in to your QuantumFusion Solutions account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"> {/* Reduced spacing */}
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-base font-semibold text-foreground">Password</FormLabel>
                      <Button variant="link" asChild className="p-0 text-sm text-primary hover:text-primary/70 transition-colors">
                        <Link href="/auth/forgot-password">Forgot Password?</Link>
                      </Button>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="********" 
                          className="rounded-2xl border-none shadow-soft-inset bg-background focus:ring-4 focus:ring-offset-2 focus:ring-primary focus:shadow-soft-inset-active transition-all duration-300 p-4 text-base"
                          {...field} 
                        />
                         <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground/80 hover:text-primary transition-colors text-lg"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                        </Button>
                      </div>
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
                disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Log In'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-base mt-2">
          <p className="text-muted-foreground w-full text-sm">
            Don't have an account?{" "}
            <Button variant="link" asChild className="p-0 text-base text-primary hover:text-primary/70 transition-colors">
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </ScrollFadeIn>
  );
}

// ... rest of your code remains the same
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="section-padding flex min-h-[calc(100vh-10rem)] items-center justify-center bg-background">
      <Suspense fallback={<LoadingSpinner />}>
        <LoginPageContent />
      </Suspense>
    </div>
  );
}