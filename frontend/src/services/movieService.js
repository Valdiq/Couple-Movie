import api from '../api/axios';

export const movieService = {
    search: async (title) => {
        const response = await api.get(`/movies/search`, { params: { title } });
        return response.data;
    },
    searchAll: async (title) => {
        const response = await api.get(`/movies/search-all`, { params: { title } });
        return response.data;
    },
    advancedSearch: async (query, page = 0, size = 15) => {
        const response = await api.get(`/movies/advanced-search`, { params: { query, page, size } });
        return response.data;
    },
    searchByGenres: async (genres, page = 0, size = 15) => {
        const response = await api.get(`/movies/by-genres`, { params: { genres: genres.join(','), page, size } });
        return response.data;
    },
    getByEmotion: async (emotion) => {
        const response = await api.get(`/movies/by-emotion`, { params: { emotion } });
        return response.data;
    },
    getByEmotions: async (emotions) => {
        const response = await api.get(`/movies/by-emotions`, { params: { emotions: emotions.join(',') } });
        return response.data;
    },
    filter: async (genres, emotions, page = 0, size = 15, awarded = false) => {
        const params = {};
        if (genres && genres.length > 0) params.genres = genres.join(',');
        if (emotions && emotions.length > 0) params.emotions = emotions.join(',');
        params.page = page;
        params.size = size;
        params.awarded = awarded;
        const response = await api.get(`/movies/filter`, { params });
        return response.data;
    },
    autocomplete: async (query, limit = 5) => {
        const response = await api.get(`/movies/autocomplete`, { params: { query, limit } });
        return response.data;
    },
    getDetails: async (id) => {
        const response = await api.get(`/movies/${id}`);
        return response.data;
    },
    batchRatings: async (ids) => {
        const response = await api.post('/movies/batch-ratings', { ids });
        return response.data;
    },
    getRandom: async () => {
        const response = await api.get(`/movies/random`);
        return response.data;
    }
};
