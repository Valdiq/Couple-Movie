import api from '../api/axios';

export const userFavoriteService = {
    list: async (userEmail) => {
        // Backend endpoint likely something like /favorites, or /users/{id}/favorites
        // Assuming /api/v1/favorites for current user
        const response = await api.get('/favorites');
        return response.data;
    },
    add: async (movieId) => {
        const response = await api.post('/favorites', { movie_id: movieId });
        return response.data;
    },
    delete: async (id) => {
        await api.delete(`/favorites/${id}`);
    },
    update: async (id, data) => {
        const response = await api.put(`/favorites/${id}`, data);
        return response.data;
    }
};
