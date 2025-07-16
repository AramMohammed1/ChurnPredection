
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export const AuthModal = ({ isOpen, onClose, onAuthenticated }: AuthModalProps) => {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loginFieldError, setLoginFieldError] = useState<string | null>(null);
  const [signupFieldError, setSignupFieldError] = useState<string | null>(null);

  // Helper: get backend URL
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Email regex for validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validation helpers
  const validateEmail = (email: string) => emailRegex.test(email);
  const validateUsername = (username: string) => username.length >= 3 && !/\s/.test(username);
  const validatePassword = (password: string) => password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);

  const handleLogin = async () => {
    setError(null);
    setLoginFieldError(null);
    // Validate login fields
    if (!loginEmail) {
      setLoginFieldError("Email or username is required");
      return;
    }
    // If input looks like an email, validate format
    if (loginEmail.includes("@") && !validateEmail(loginEmail)) {
      setLoginFieldError("Invalid email format");
      return;
    }
    if (!loginPassword) {
      setLoginFieldError("Password is required");
      return;
    }
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", loginEmail);
      formData.append("password", loginPassword);
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Login failed");
        setIsLoading(false);
        return;
      }
      localStorage.setItem("token", data.access_token);
      setIsLoading(false);
      onAuthenticated();
    } catch (err) {
      setError("Network error");
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setError(null);
    setSignupFieldError(null);
    // Validate signup fields
    if (!signupName) {
      setSignupFieldError("Username is required");
      return;
    }
    if (!validateUsername(signupName)) {
      setSignupFieldError("Username must be at least 3 characters and contain no spaces");
      return;
    }
    if (!signupEmail) {
      setSignupFieldError("Email is required");
      return;
    }
    if (!validateEmail(signupEmail)) {
      setSignupFieldError("Invalid email format");
      return;
    }
    if (!signupPassword) {
      setSignupFieldError("Password is required");
      return;
    }
    if (!validatePassword(signupPassword)) {
      setSignupFieldError("Password must be at least 8 characters, include a letter and a number");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: signupName,
          email: signupEmail,
          password: signupPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Signup failed");
        setIsLoading(false);
        return;
      }
      localStorage.setItem("token", data.access_token);
      setIsLoading(false);
      onAuthenticated();
    } catch (err) {
      setError("Network error");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <DialogTitle>Welcome to EcommerceAI</DialogTitle>
          <DialogDescription>
            Access powerful AI analytics for your e-commerce business
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email or Username</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {loginFieldError && <div className="text-red-500 text-sm">{loginFieldError}</div>}
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <Button 
                  onClick={handleLogin} 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create Account</CardTitle>
                <CardDescription>
                  Get started with your free analytics account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="username"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showSignupPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowSignupPassword((v) => !v)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {signupFieldError && <div className="text-red-500 text-sm">{signupFieldError}</div>}
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <Button 
                  onClick={handleSignup} 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
