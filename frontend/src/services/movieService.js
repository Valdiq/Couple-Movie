import api from '../api/axios';

export const movieService = {
    search: async (title) => {
        const response = await api.get(`/movies/search`, { params: { title } });
        return response.data;
    },
    list: async (sort, limit) => {
        // Backend doesn't support list with sort/limit directly in the same way?
        // It has /search and /advanced-search.
        // Let's use advanced-search with a wildcard or match all.
        const response = await api.get(`/movies/search`, { params: { title: 'star' } }); // Placeholder default search
        return response.data;
    },
    getDetails: async (id) => {
        const response = await api.get(`/movies/${id}`);
        return response.data;
    }
};
