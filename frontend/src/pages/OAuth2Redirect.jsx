import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuth2Redirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            localStorage.setItem('jwt', token);
        }
        window.location.href = '/';
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="text-slate-400 text-lg">Authenticating with Google...</div>
        </div>
    );
};

export default OAuth2Redirect;
