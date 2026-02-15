import { authService } from '../services/authService';

export const User = {
    login: async (email, password) => {
        if (!email && !password) {
            window.location.href = '/login';
            return;
        }
        return authService.login(email, password);
    },
    logout: () => {
        authService.logout();
    },
    register: async (firstname, lastname, email, password) => {
        return authService.register(firstname, lastname, email, password);
    },
    me: async () => {
        return authService.getCurrentUser();
    },
    updateMyUserData: async (data) => {
        return authService.updateUser(data);
    },
    loginWithRedirect: (url) => {
        window.location.href = '/login?redirect=' + encodeURIComponent(url);
    }
};
