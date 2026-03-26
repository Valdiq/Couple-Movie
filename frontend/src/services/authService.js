import api from '../api/axios';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/authenticate', { email, password });
        console.log('login', response.data);
        return response.data;
    },
    register: async (firstname, lastname, username, email, password) => {
        const response = await api.post('/auth/register', { firstName: firstname, lastName: lastname, username, email, password });
        return response.data;
    },
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
        }
        window.location.href = '/login';
    },
    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/me');
            console.log('getCurrentUser', response.data);
            return response.data;
        } catch (e) {
            return null;
        }
    },
    updateUser: async (data) => {
        const response = await api.put('/auth/me', data);
        return response.data;
    },
    resetPassword: async (currentPassword, newPassword) => {
        const response = await api.post('/auth/update-password', { currentPassword, newPassword });
        return response.data;
    },
    verifyEmail: async (token) => {
        const response = await api.post('/auth/verify-email', { token });
        return response.data;
    },
    resendVerification: async (email) => {
        const response = await api.post('/auth/resend-verification', { email });
        return response.data;
    },
    forgotPassword: async (email) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPasswordToken: async (token, newPassword) => {
        const response = await api.post('/auth/forgot-password-token', { token, newPassword });
        return response.data;
    }
};
