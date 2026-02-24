import api from '../api/axios';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/authenticate', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },
    register: async (firstname, lastname, username, email, password) => {
        const response = await api.post('/auth/register', { firstName: firstname, lastName: lastname, username, email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    },
    getCurrentUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (e) {
            // Token expired or invalid
            localStorage.removeItem('token');
            return null;
        }
    },
    updateUser: async (data) => {
        const response = await api.put('/auth/me', data);
        return response.data;
    },
    resetPassword: async (currentPassword, newPassword) => {
        const response = await api.post('/auth/reset-password', { currentPassword, newPassword });
        return response.data;
    }
};
