import api from '../api/axios';

export const movieService = {
    search: async (title) => {
        const response = await api.get(`/movies/search`, { params: { title } });
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
    getDetails: async (id) => {
        const response = await api.get(`/movies/${id}`);
        return response.data;
    }
};
