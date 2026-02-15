import { movieService } from '../services/movieService';

export const Movie = {
    list: async (sort, limit) => {
        // Adapter to match expected signature
        try {
            const response = await movieService.list(sort, limit);
            // Ensure response is an array
            if (Array.isArray(response)) {
                return response;
            } else if (response.content && Array.isArray(response.content)) {
                return response.content;
            } else if (response.Search && Array.isArray(response.Search)) {
                // OMDb format
                return response.Search.map(m => ({
                    id: m.imdbID,
                    title: m.Title,
                    poster: m.Poster,
                    year: m.Year,
                    // Add other mapped fields if needed
                }));
            }
            return [];
        } catch (e) {
            console.error("Failed to list movies", e);
            return [];
        }
    },
    get: async (id) => {
        return movieService.getDetails(id);
    }
};
