import api from '../api/axios';

export const userFavoriteService = {
    list: async () => {
        const response = await api.get('/favorites');
        return response.data;
    },
    add: async (movieData) => {
        const response = await api.post('/favorites', movieData);
        return response.data;
    },
    remove: async (imdbId) => {
        await api.delete(`/favorites/${imdbId}`);
    },
    check: async (imdbId) => {
        try {
            const response = await api.get(`/favorites/check/${imdbId}`);
            return response.data.is_favorite;
        } catch (e) {
            return false;
        }
    }
};
