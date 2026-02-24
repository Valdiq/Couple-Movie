import api from '../api/axios';

export const coupleService = {
    invite: async (username) => {
        const response = await api.post(`/couple/invite?username=${encodeURIComponent(username)}`);
        return response.data;
    },
    getInvites: async () => {
        try {
            const response = await api.get('/couple/invites');
            return response.data;
        } catch (e) {
            return [];
        }
    },
    acceptInvite: async (requestId) => {
        const response = await api.post(`/couple/accept/${requestId}`);
        return response.data;
    },
    rejectInvite: async (requestId) => {
        const response = await api.post(`/couple/reject/${requestId}`);
        return response.data;
    },
    getPartner: async () => {
        try {
            const response = await api.get('/couple/partner');
            return response.data;
        } catch (e) {
            return null;
        }
    },
    breakCouple: async () => {
        const response = await api.post('/couple/break');
        return response.data;
    }
};
