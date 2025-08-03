import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import tinhihLogo from "@assets/tinhih-logo.svg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/auth-context";
import { Stethoscope, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

// Password strength indicator component
function PasswordStrengthIndicator({ password }: { password: string }) {
  const getPasswordStrength = (password: string) => {
    let score = 0;
    let feedback = [];

    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (password.length < 6) feedback.push("At least 6 characters");
    if (!/[a-z]/.test(password)) feedback.push("One lowercase letter");
    if (!/[A-Z]/.test(password)) feedback.push("One uppercase letter");
    if (!/\d/.test(password)) feedback.push("One number");

    return { score, feedback };
  };

  const { score, feedback } = getPasswordStrength(password);
  const percentage = (score / 6) * 100;

  if (password.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength</span>
        <span className={percentage >= 80 ? "text-green-600" : percentage >= 60 ? "text-yellow-600" : "text-red-600"}>
          {percentage >= 80 ? "Strong" : percentage >= 60 ? "Good" : percentage >= 40 ? "Fair" : "Weak"}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      {feedback.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <p>Requirements:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            {feedback.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  role: z.enum(["practitioner", "staff", "patient"]),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function Login() {
  const { login, register, forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "patient",
    },
  });

  const forgotPasswordForm = useForm<{ email: string }>({
    resolver: zodResolver(z.object({
      email: z.string().email("Please enter a valid email address"),
    })),
    defaultValues: {
      email: "",
    },
  });

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError("");
    setLoginSuccess(false);
    
    try {
      await login(data.email, data.password);
      setLoginSuccess(true);
      // Clear form on success
      loginForm.reset();
    } catch (error: any) {
      setLoginError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setRegisterError("");
    setRegisterSuccess(false);
    
    try {
      await register(data);
      setRegisterSuccess(true);
      // Clear form on success
      registerForm.reset();
    } catch (error: any) {
      setRegisterError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async (data: { email: string }) => {
    setIsLoading(true);
    setForgotPasswordError("");
    setForgotPasswordSuccess(false);
    
    try {
      await forgotPassword(data.email);
      setForgotPasswordSuccess(true);
      // Clear form on success
      forgotPasswordForm.reset();
    } catch (error: any) {
      setForgotPasswordError(error.message || "Failed to send password reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              <img 
                src={tinhihLogo} 
                alt="TiNHiH Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-3xl font-bold text-slate-900">TiNHiH Foundation</span>
          </div>
          <p className="text-slate-600">TiNHiH Foundation Management Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="forgot-password">Forgot Password</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                {/* Login Success Alert */}
                {loginSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Login successful! Redirecting...
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Login Error Alert */}
                {loginError && (
                  <Alert variant="destructive" className="border-red-500 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 font-medium">
                      {loginError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter your email" 
                              {...field}
                              disabled={isLoading}
                              className={`${loginError ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500" : ""}`}
                            />
                          </FormControl>
                          <FormMessage className="text-red-600 font-medium" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password" 
                                {...field}
                                disabled={isLoading}
                                className={`${loginError ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500" : ""}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-600 font-medium" />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                {/* Register Success Alert */}
                {registerSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Account created successfully! Redirecting...
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Register Error Alert */}
                {registerError && (
                  <Alert variant="destructive" className="border-red-500 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 font-medium">
                      {registerError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">First Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="First name" 
                                {...field}
                                disabled={isLoading}
                                className={`${registerError ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500" : ""}`}
                              />
                            </FormControl>
                            <FormMessage className="text-red-600 font-medium" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Last name" 
                                {...field}
                                disabled={isLoading}
                                className={`${registerError ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500" : ""}`}
                              />
                            </FormControl>
                            <FormMessage className="text-red-600 font-medium" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter your email" 
                              {...field}
                              disabled={isLoading}
                              className={`${registerError ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500" : ""}`}
                            />
                          </FormControl>
                          <FormMessage className="text-red-600 font-medium" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password" 
                                {...field}
                                disabled={isLoading}
                                className={`${registerError ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500" : ""}`}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setPassword(e.target.value);
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <PasswordStrengthIndicator password={password} />
                          <FormMessage className="text-red-600 font-medium" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                            <FormControl>
                              <SelectTrigger className={`${registerError ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500" : ""}`}>
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="patient">Patient</SelectItem>
                              <SelectItem value="practitioner">Healthcare Practitioner</SelectItem>
                              <SelectItem value="staff">Staff Member</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-600 font-medium" />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Creating account...</span>
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="forgot-password" className="space-y-4">
                {/* Forgot Password Success Alert */}
                {forgotPasswordSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Password reset email sent! Please check your email for instructions.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Forgot Password Error Alert */}
                {forgotPasswordError && (
                  <Alert variant="destructive" className="border-red-500 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 font-medium">
                      {forgotPasswordError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Forgot Your Password?</h3>
                  <p className="text-slate-600 text-sm">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>
                
                <Form {...forgotPasswordForm}>
                  <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter your email address" 
                              {...field}
                              disabled={isLoading}
                              className={`${forgotPasswordError ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500" : ""}`}
                            />
                          </FormControl>
                          <FormMessage className="text-red-600 font-medium" />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending reset email...</span>
                        </div>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
