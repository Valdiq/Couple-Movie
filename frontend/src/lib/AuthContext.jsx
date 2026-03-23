import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { userFavoriteService } from '../services/userFavoriteService';
import { coupleMovieService } from '../services/coupleMovieService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [userFavorites, setUserFavorites] = useState([]);
    const [myCoupleMovieIds, setMyCoupleMovieIds] = useState([]);

    useEffect(() => {
        checkUserAuth();
    }, []);

    const checkUserAuth = async () => {
        setIsLoadingAuth(true);
        try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
                try {
                    const [favIds, coupleIds] = await Promise.all([
                        userFavoriteService.getIds(),
                        currentUser.partner_id ? coupleMovieService.getMyIds() : Promise.resolve([])
                    ]);
                    setUserFavorites(favIds);
                    setMyCoupleMovieIds(coupleIds);
                } catch (e) {
                    console.error("Failed to load user preferences", e);
                }
            } else {
                setIsAuthenticated(false);
                setUserFavorites([]);
                setMyCoupleMovieIds([]);
            }
        } catch (error) {
            console.error("Auth check failed", error);
            setIsAuthenticated(false);
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const login = async (email, password) => {
        try {
            const data = await authService.login(email, password);
            await checkUserAuth();
            return data;
        } catch (e) {
            throw e;
        }
    }

    const logout = async () => {
        setUser(null);
        setIsAuthenticated(false);
        setUserFavorites([]);
        setMyCoupleMovieIds([]);
        await authService.logout();
    };

    const addFavoriteId = (id) => setUserFavorites(prev => [...prev, id]);
    const removeFavoriteId = (id) => setUserFavorites(prev => prev.filter(fid => fid !== id));
    
    const addCoupleMovieId = (id) => setMyCoupleMovieIds(prev => [...prev, id]);
    const removeCoupleMovieId = (id) => setMyCoupleMovieIds(prev => prev.filter(fid => fid !== id));

    const navigateToLogin = () => {
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            login,
            logout,
            navigateToLogin,
            userFavorites,
            addFavoriteId,
            removeFavoriteId,
            myCoupleMovieIds,
            addCoupleMovieId,
            removeCoupleMovieId
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
