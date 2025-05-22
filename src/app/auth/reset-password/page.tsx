
"use client";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";
// import { useSearchParams } from 'next/navigation'; // To get token in a real app

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  // const searchParams = useSearchParams(); // In a real app, you'd get the token
  // const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  function onSubmit(values: ResetPasswordFormValues) {
    console.log("Reset password form submitted:", values/*, "Token:", token*/);
    // Here you would typically call your backend API to reset the password using the token
    alert("Password reset successful (simulated)! Check console for data.");
    form.reset();
    // Potentially redirect user: router.push('/auth/login');
  }

  return (
    <div className="section-padding bg-background flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <ScrollFadeIn className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <KeyRound className="mx-auto h-12 w-12 text-primary mb-4 neon-icon" />
            <CardTitle className="text-3xl">Reset Your Password</CardTitle>
            <CardDescription>
              Enter a new password for your account.
              {/* {token ? "Enter a new password." : "Invalid or expired reset link."} */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* {!token && (
              <div className="text-center text-destructive">
                <p>This password reset link is invalid or has expired.</p>
                <Button variant="link" asChild className="mt-4">
                  <Link href="/auth/forgot-password">Request a new link</Link>
                </Button>
              </div>
            )} */}
            {/* {token && ( */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showNewPassword ? "text" : "password"} placeholder="********" {...field} />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showConfirmNewPassword ? "text" : "password"} placeholder="********" {...field} />
                             <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            >
                              {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Reset Password
                  </Button>
                </form>
              </Form>
            {/* )} */}
             <div className="mt-6 text-center">
                <Button variant="link" asChild className="p-0 text-primary mx-auto">
                    <Link href="/auth/login">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Log In
                    </Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </ScrollFadeIn>
    </div>
  );
}
