import api from '../api/axios';

export const coupleService = {
    create: async (partnerEmail) => {
        const response = await api.post('/couples', { partner_email: partnerEmail });
        return response.data;
    },
    get: async () => {
        try {
            const response = await api.get('/couples/current');
            return response.data;
        } catch (e) {
            return null;
        }
    },
    leave: async () => {
        await api.delete('/couples/current');
    }
};
