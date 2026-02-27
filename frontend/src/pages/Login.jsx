import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Film } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast({ variant: "success", title: "Login Successful", description: "Welcome back!" });
            navigate('/');
        } catch (error) {
            toast({ variant: "destructive", title: "Login Failed", description: error.response?.data?.message || "Invalid credentials" });
        } finally { setLoading(false); }
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8082/oauth2/authorization/google';
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="pointer-events-none absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
            <Card className="relative w-full max-w-md border-border bg-card text-foreground">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                        <Film className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Login to CoupleMovie</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="m@example.com" value={email}
                                onChange={(e) => setEmail(e.target.value)} required
                                className="border-border bg-background text-foreground" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                                    Forgot Password?
                                </Link>
                            </div>
                            <Input id="password" type="password" value={password}
                                onChange={(e) => setPassword(e.target.value)} required
                                className="border-border bg-background text-foreground" />
                        </div>
                        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
                    </div>

                    <Button type="button" variant="outline" className="w-full border-border text-foreground hover:bg-secondary" onClick={handleGoogleLogin}>
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary hover:text-primary/80">Sign up</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;
