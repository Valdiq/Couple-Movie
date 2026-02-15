import React, { useState } from 'react';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext'; // Import validation logic if needed, but User entity handles register

const Register = () => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        password: ''
    });
    const navigate = useNavigate();
    const { toast } = useToast();
    const { login } = useAuth(); // To auto-login after register
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await User.register(formData.firstname, formData.lastname, formData.email, formData.password);
            // Auto login or redirect to login
            await login(formData.email, formData.password);
            toast({
                title: "Registration Successful",
                description: "Welcome to CoupleMovie!",
            });
            navigate('/');
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: error.response?.data?.message || "Could not create account",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-slate-100">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        Join CoupleMovie to start your journey
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstname">First Name</Label>
                                <Input
                                    id="firstname"
                                    placeholder="John"
                                    value={formData.firstname}
                                    onChange={handleChange}
                                    required
                                    className="bg-slate-900 border-slate-700 text-slate-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastname">Last Name</Label>
                                <Input
                                    id="lastname"
                                    placeholder="Doe"
                                    value={formData.lastname}
                                    onChange={handleChange}
                                    required
                                    className="bg-slate-900 border-slate-700 text-slate-100"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="bg-slate-900 border-slate-700 text-slate-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="bg-slate-900 border-slate-700 text-slate-100"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90" disabled={loading}>
                            {loading ? "Creating Account..." : "Register"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-purple-400 hover:text-purple-300">
                            Login
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Register;
