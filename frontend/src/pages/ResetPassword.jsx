import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { authService } from '@/services/authService';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPw, setShowNewPw] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg('Invalid or missing password reset token.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setStatus('error');
            setErrorMsg('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setStatus('error');
            setErrorMsg('Password must be at least 6 characters');
            return;
        }

        setStatus('submitting');
        try {
            await authService.resetPasswordToken(token, newPassword);
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.response?.data?.error || 'Failed to reset password. The link might be expired.');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                <div className="text-center pt-8 pb-4 relative z-10">
                    <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Set New Password</h2>
                    <p className="text-muted-foreground mt-2 px-8">Please enter your new password below.</p>
                </div>

                <div className="p-8 pt-4 relative z-10">
                    <AnimatePresence>
                        {errorMsg && status === 'error' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-xl flex items-center gap-2">
                                    <XCircle className="h-5 w-5 flex-shrink-0" />
                                    <span className="flex-1">{errorMsg}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {status === 'success' ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                            <div className="mx-auto mb-4 w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Password Reset Successful</h3>
                            <p className="text-sm text-muted-foreground mb-6">You will be redirected to the login page shortly.</p>
                            <Link to="/login" className="inline-block w-full text-white bg-secondary hover:bg-secondary/80 font-bold rounded-xl text-sm px-5 py-4 transition-all">
                                Go to Login Now
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} disabled={!token || status === 'submitting'}
                                        className="w-full bg-secondary/50 border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary block pl-10 pr-10 p-3.5 transition-all" placeholder="New password" />
                                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} disabled={!token} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground">
                                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={!token || status === 'submitting'}
                                        className="w-full bg-secondary/50 border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary block pl-10 p-3.5 transition-all" placeholder="Confirm new password" />
                                </div>
                            </div>

                            <button type="submit" disabled={status === 'submitting' || !token || !newPassword || !confirmPassword}
                                className="w-full text-white bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 focus:ring-4 focus:outline-none focus:ring-primary/30 font-bold rounded-xl text-sm px-5 py-4 text-center transition-all shadow-lg hover:shadow-primary/20 flex justify-center items-center gap-2 disabled:opacity-50">
                                {status === 'submitting' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
