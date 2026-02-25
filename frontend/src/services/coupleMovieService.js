import api from '../api/axios';

export const coupleMovieService = {
    list: async () => {
        try {
            const response = await api.get('/couple/movies');
            return response.data;
        } catch (e) {
            return [];
        }
    },
    add: async (movieData) => {
        const response = await api.post('/couple/movies', movieData);
        return response.data;
    },
    remove: async (imdbId) => {
        await api.delete(`/couple/movies/${imdbId}`);
    },
    updateStatus: async (imdbId, data) => {
        const response = await api.patch(`/couple/movies/${imdbId}`, data);
        return response.data;
    },
    rate: async (imdbId, rating) => {
        const response = await api.post(`/couple/movies/${imdbId}/rate`, { rating });
        return response.data;
    },
    stats: async () => {
        try {
            const response = await api.get('/couple/movies/stats');
            return response.data;
        } catch (e) {
            return { matches: 0, watchlist: 0, watched: 0 };
        }
    },
    check: async (imdbId) => {
        try {
            const response = await api.get(`/couple/movies/check/${imdbId}`);
            return response.data;
        } catch (e) {
            return { in_list: false };
        }
    }
};
