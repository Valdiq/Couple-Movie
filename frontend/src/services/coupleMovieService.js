import api from '../api/axios';

export const coupleMovieService = {
    list: async () => {
        // Backend endpoint for shared movies
        // Assuming /couples/current/movies or similar
        try {
            const response = await api.get('/couples/current/movies');
            return response.data;
        } catch (e) {
            return [];
        }
    },
    add: async (movieId) => {
        // Add to shared list
        const response = await api.post('/couples/current/movies', { movie_id: movieId });
        return response.data;
    },
    delete: async (id) => {
        await api.delete(`/couples/current/movies/${id}`);
    },
    update: async (id, data) => {
        const response = await api.put(`/couples/current/movies/${id}`, data);
        return response.data;
    }
};
