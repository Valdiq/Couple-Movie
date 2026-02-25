import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/authService';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsSubmitting(true);
        try {
            await authService.forgotPassword(email);
            setIsSuccess(true);
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'An error occurred. Please try again.');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                <div className="text-center pt-8 pb-4 relative z-10">
                    <Link to="/login" className="absolute left-6 top-8 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Reset Password</h2>
                    <p className="text-muted-foreground mt-2 px-8">Enter your email address to receive a password reset link.</p>
                </div>

                <div className="p-8 pt-4 relative z-10">
                    <AnimatePresence>
                        {errorMsg && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-xl flex items-center">
                                    <span className="flex-1">{errorMsg}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isSuccess ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground ml-1">Email <span className="text-primary">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                        className="w-full bg-secondary/50 border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary block pl-10 p-3.5 transition-all" placeholder="name@example.com" />
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting || !email}
                                className="w-full text-white bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 focus:ring-4 focus:outline-none focus:ring-primary/30 font-bold rounded-xl text-sm px-5 py-4 text-center transition-all shadow-lg hover:shadow-primary/20 flex justify-center items-center gap-2 disabled:opacity-50">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                            </button>
                        </form>
                    ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                            <div className="mx-auto mb-4 w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Check Your Email</h3>
                            <p className="text-sm text-muted-foreground">We've sent a password reset link to <span className="text-white font-medium">{email}</span>.</p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
