import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg('No verification token provided.');
            return;
        }

        const verify = async () => {
            try {
                await authService.verifyEmail(token);
                setStatus('success');
            } catch (err) {
                setStatus('error');
                setErrorMsg(err.response?.data?.error || 'Failed to verify email. The link may be expired.');
            }
        };
        verify();
    }, [token]);

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-2xl">

                {status === 'loading' && (
                    <div className="py-8">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                        <h2 className="mt-4 text-xl font-bold text-foreground">Verifying Email...</h2>
                        <p className="mt-2 text-sm text-muted-foreground">Please wait while we confirm your email address.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-4">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-900/30">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold text-foreground">Email Verified!</h2>
                        <p className="mb-8 text-muted-foreground">Your email has been successfully verified. You can now use all features of CoupleMovie.</p>
                        <Link to="/" className="inline-block w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3.5 font-bold text-primary-foreground transition-all hover:opacity-90">
                            Go to Homepage
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-4">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-900/30">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold text-foreground">Verification Failed</h2>
                        <p className="mb-8 text-muted-foreground">{errorMsg}</p>
                        <Link to="/profile" className="inline-block w-full rounded-xl border border-border bg-secondary py-3.5 font-bold text-foreground transition-all hover:bg-secondary/80">
                            Go to Profile
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
