import api from '../api/axios';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/authenticate', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },
    register: async (firstname, lastname, email, password) => {
        const response = await api.post('/auth/register', { firstname, lastname, email, password });
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
        // Return mock user or fetch from backend
        // Since backend doesn't have /me, we mock it or use stored data
        // Ideally we should add /me endpoint to backend
        // For now, let's try to decode token or just return a mock if token exists
        const token = localStorage.getItem('token');
        if (!token) return null;

        // Mock user for now since we don't have a backend endpoint that returns full user details
        // OR try to fetch from /api/v1/users/me if we add it
        // Let's assume we can get it.
        try {
            // const response = await api.get('/auth/me'); // Not existing yet
            // return response.data;
            return {
                email: "user@example.com",
                firstname: "John",
                lastname: "Doe",
                full_name: "John Doe",
                subscription_plan: "free",
                created_date: new Date().toISOString()
            };
        } catch (e) {
            return null;
        }
    },
    updateUser: async (data) => {
        // Mock update
        return {
            email: "user@example.com",
            firstname: "John",
            lastname: "Doe",
            full_name: "John Doe",
            subscription_plan: data.subscription_plan || "free",
            created_date: new Date().toISOString()
        };
    }
};
