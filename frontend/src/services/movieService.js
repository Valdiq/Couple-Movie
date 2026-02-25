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
    advancedSearch: async (query) => {
        const response = await api.get(`/movies/advanced-search`, { params: { query } });
        return response.data;
    },
    searchByGenres: async (genres) => {
        const response = await api.get(`/movies/by-genres`, { params: { genres: genres.join(',') } });
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
    filter: async (genres, emotions) => {
        const params = {};
        if (genres && genres.length > 0) params.genres = genres.join(',');
        if (emotions && emotions.length > 0) params.emotions = emotions.join(',');
        const response = await api.get(`/movies/filter`, { params });
        return response.data;
    },
    getDetails: async (id) => {
        const response = await api.get(`/movies/${id}`);
        return response.data;
    },
    batchRatings: async (ids) => {
        const response = await api.post('/movies/batch-ratings', { ids });
        return response.data;
    }
};
