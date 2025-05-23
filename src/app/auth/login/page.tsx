"use client"; // Make this entire page a Client Component

import Link from "next/link";
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
import { useState } from "react"; // Removed useEffect as it's not used here
import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams(); // Can use this directly now

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    
    login(values.email, values.password); // AuthContext handles toast & redirection
    
    // setIsSubmitting(false) might not be necessary here if login redirects immediately
    // or if the component unmounts. If login simulation is quick, it's fine.
    // For a real API call, you'd setSubmitting(false) in the .finally() block.
    // Since our login is synchronous for now, we can set it false if needed.
    setIsSubmitting(false); 
  }

  // Example: Reading a 'redirectUrl' from searchParams, though not used by AuthContext currently for redirection
  // useEffect(() => {
  //   const redirect = searchParams.get('redirectUrl');
  //   if (redirect) {
  //     console.log("Redirect URL from params:", redirect);
  //     // You could store this and use it in AuthContext if needed
  //   }
  // }, [searchParams]);

  return (

    <div className="section-padding bg-background flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <ScrollFadeIn className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <LogIn className="mx-auto h-12 w-12 text-primary mb-4 neon-icon" />
            <CardTitle className="text-3xl">Welcome Back</CardTitle>
            <CardDescription>Log in to your QuantumFusion Solutions account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
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
                        <FormLabel>Password</FormLabel>
                        <Button variant="link" asChild className="p-0 text-xs text-primary">
                          <Link href="/auth/forgot-password">Forgot Password?</Link>
                        </Button>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="********" {...field} />
                           <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Log In'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="text-center text-sm">
            <p className="text-muted-foreground w-full">
              Don't have an account?{" "}
              <Button variant="link" asChild className="p-0 text-primary">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </p>
          </CardFooter>
        </Card>
      </ScrollFadeIn>
    </div>

  );
}
