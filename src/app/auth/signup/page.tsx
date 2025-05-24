
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
import { UserPlus, Eye, EyeOff, MailCheck, ShieldCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from 'next/navigation';

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/(?=.*[A-Z])/, { message: "Password must contain at least one uppercase letter." })
    .regex(/(?=.*\d)/, { message: "Password must contain at least one digit." })
    .regex(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, { message: "Password must contain at least one special character." }),
  confirmPassword: z.string(),
  otp: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const SIMULATED_OTP = "123456";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState("");

  const { toast } = useToast();
  const { signup } = useAuth();
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      otp: "",
    },
  });

  const handleSendOtp = async () => {
    const emailValue = form.getValues("email");
    const emailState = form.getFieldState("email");

    if (!emailValue || emailState.invalid) {
      form.setError("email", { type: "manual", message: "Please enter a valid email to send OTP." });
      toast({ title: "Email Required", description: "Please enter a valid email address first.", variant: "destructive" });
      return;
    }

    setIsSendingOtp(true);
    setEmailForOtp(emailValue);
    console.log("SIMULATION: Sending OTP to", emailValue);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setOtpSent(true);
    setIsSendingOtp(false);
    toast({
      title: "OTP Sent (Simulated)",
      description: `An OTP has been sent to ${emailValue}. (Simulated OTP: ${SIMULATED_OTP})`,
    });
  };

  const handleVerifyOtp = async () => {
    const otpValue = form.getValues("otp");
    if (!otpValue || otpValue.length !== 6) {
        form.setError("otp", { type: "manual", message: "Please enter a valid 6-digit OTP."});
        toast({ title: "Invalid OTP", description: "Please enter a valid 6-digit OTP.", variant: "destructive" });
        return;
    }
    setIsVerifyingOtp(true);
    console.log("SIMULATION: Verifying OTP", otpValue, "for email", emailForOtp);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (otpValue === SIMULATED_OTP) {
      setOtpVerified(true);
      setOtpSent(false); // Hide OTP input section
      setIsVerifyingOtp(false);
      toast({
        title: "OTP Verified Successfully!",
        description: "Your email has been verified. You can now complete the signup.",
        variant: "default",
      });
    } else {
      setOtpVerified(false);
      setIsVerifyingOtp(false);
      form.setError("otp", { type: "manual", message: "Invalid OTP. Please try again or resend."});
      toast({
        title: "OTP Verification Failed",
        description: "The OTP you entered is incorrect. Please try again.",
        variant: "destructive",
      });
    }
  };

  async function onSubmit(values: SignupFormValues) {
    if (!otpVerified) {
      toast({
        title: "Email Verification Required",
        description: "Please verify your email address with OTP before signing up.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    // Pass fullName, email, and password to the signup function in AuthContext
    signup(values.fullName, values.email, values.password); 
    
    // Redirection and success/failure toasts are handled by AuthContext
    // No need to call router.push here directly if AuthContext handles it.
    setIsSubmitting(false);
  }

  const watchEmail = form.watch("email");

  return (
    <div className="section-padding bg-background flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <ScrollFadeIn className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <UserPlus className="mx-auto h-12 w-12 text-primary mb-4 neon-icon" />
            <CardTitle className="text-3xl">Create Account</CardTitle>
            <CardDescription>Join QuantumFusion Solutions to unlock exclusive features.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Prabhat Kumar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="your.email@example.com" 
                            {...field} 
                            disabled={otpSent || otpVerified || isSendingOtp || isSubmitting}
                          />
                        </FormControl>
                        {!otpSent && !otpVerified && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp || !watchEmail || form.getFieldState("email").invalid || isSubmitting}
                            className="flex-shrink-0"
                          >
                            {isSendingOtp ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MailCheck className="h-4 w-4" />
                            )}
                            <span className="ml-2 hidden sm:inline">Send OTP</span>
                          </Button>
                        )}
                         {otpVerified && (
                            <ShieldCheck className="h-5 w-5 text-green-500 flex-shrink-0" title="Email Verified" />
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {otpSent && !otpVerified && (
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enter OTP sent to {emailForOtp}</FormLabel>
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Input placeholder="6-digit OTP" {...field} maxLength={6} disabled={isVerifyingOtp || isSubmitting}/>
                          </FormControl>
                          <Button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={isVerifyingOtp || !field.value || field.value.length !== 6 || isSubmitting}
                            className="flex-shrink-0"
                          >
                            {isVerifyingOtp ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                               <ShieldCheck className="h-4 w-4" />
                            )}
                             <span className="ml-2 hidden sm:inline">Verify OTP</span>
                          </Button>
                        </div>
                        <FormDescription>
                          Didn't receive OTP?{" "}
                          <Button 
                            type="button" 
                            variant="link" 
                            className="p-0 h-auto text-xs" 
                            onClick={handleSendOtp} 
                            disabled={isSendingOtp || isSubmitting}
                          >
                            {isSendingOtp ? "Resending..." : "Resend OTP"}
                          </Button>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="********" {...field} disabled={isSubmitting}/>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                             disabled={isSubmitting}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Must be 8+ characters, with uppercase, digit, & special character.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                         <div className="relative">
                          <Input type={showConfirmPassword ? "text" : "password"} placeholder="********" {...field} disabled={isSubmitting} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isSubmitting}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!otpVerified || isSendingOtp || isVerifyingOtp || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (otpVerified ? "Sign Up" : "Verify Email to Sign Up")}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="text-center text-sm">
            <p className="text-muted-foreground w-full">
              Already have an account?{" "}
              <Button variant="link" asChild className="p-0 text-primary">
                <Link href="/auth/login">Log In</Link>
              </Button>
            </p>
          </CardFooter>
        </Card>
      </ScrollFadeIn>
    </div>
  );
}
