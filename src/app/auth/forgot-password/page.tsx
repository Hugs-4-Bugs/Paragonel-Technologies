
"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MailQuestion, ArrowLeft } from "lucide-react";
import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    console.log("Forgot password form submitted:", values);
    // Here you would typically call your backend API to send a reset link
    alert("If an account with this email exists, a password reset link has been sent (simulated). Check console for data.");
    form.reset();
  }

  return (
    <div className="section-padding bg-background flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <ScrollFadeIn className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <MailQuestion className="mx-auto h-12 w-12 text-primary mb-4 neon-icon" />
            <CardTitle className="text-3xl">Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password (simulation).
            </CardDescription>
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
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Send Reset Link
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="text-center text-sm">
             <Button variant="link" asChild className="p-0 text-primary mx-auto">
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
