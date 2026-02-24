import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuth2Redirect = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            navigate('/');
            // Force page reload to refresh auth state
            window.location.href = '/';
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="text-slate-400 text-lg">Authenticating with Google...</div>
        </div>
    );
};

export default OAuth2Redirect;
