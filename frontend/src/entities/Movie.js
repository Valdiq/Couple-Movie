import { movieService } from '../services/movieService';

const mapOmdbToFrontend = (m) => ({
    id: m.imdbID || m.imdbId || m.imdbid,
    title: m.Title || m.title,
    poster: m.Poster || m.poster,
    year: m.Year || m.year,
    type: m.Type || m.type,
    genre: m.Genre || m.genre,
    director: m.Director || m.director,
    writer: m.Writer || m.writer,
    actors: m.Actors || m.actors,
    plot: m.Plot || m.plot,
    language: m.Language || m.language,
    country: m.Country || m.country,
    awards: m.Awards || m.awards,
    runtime: m.Runtime || m.runtime,
    imdb_rating: m.imdbRating || m.imdb_rating || m.imdbrating,
    imdb_votes: m.imdbVotes || m.imdb_votes || m.imdbvotes,
});

export const Movie = {
    list: async (sort, limit) => {
        return [];
    },
    search: async (title) => {
        try {
            const response = await movieService.searchAll(title);
            const searchResults = response?.Search || response?.search || [];
            if (Array.isArray(searchResults)) {
                return searchResults.map(mapOmdbToFrontend);
            }
            return [];
        } catch (e) {
            console.error("Failed to search movies", e);
            return [];
        }
    },
    advancedSearch: async (query, page = 0, size = 20) => {
        try {
            const response = await movieService.advancedSearch(query, page, size);
            const movies = (response.movies || []).map(mapOmdbToFrontend);
            return { movies, totalHits: response.totalHits || 0, page: response.page, size: response.size };
        } catch (e) {
            console.error("Failed to advanced search movies", e);
            return { movies: [], totalHits: 0, page, size };
        }
    },
    aiSearch: async (query, page = 0, size = 20) => {
        try {
            const response = await movieService.aiSearch(query, page, size);
            const movies = (response.movies || []).map(mapOmdbToFrontend);
            return { movies, totalHits: response.totalHits || 0, page: response.page, size: response.size };
        } catch (e) {
            console.error("Failed to AI search movies", e);
            return { movies: [], totalHits: 0, page, size };
        }
    },
    autocomplete: async (query, limit = 5) => {
        try {
            const results = await movieService.autocomplete(query, limit);
            if (Array.isArray(results)) {
                return results.map(mapOmdbToFrontend);
            }
            return [];
        } catch (e) {
            console.error("Failed to autocomplete movies", e);
            return [];
        }
    },
    batchRatings: async (ids) => {
        try {
            return await movieService.batchRatings(ids);
        } catch (e) {
            return {};
        }
    },
    getDetails: async (imdbId) => {
        try {
            const data = await movieService.getDetails(imdbId);
            const mapped = mapOmdbToFrontend(data);
            // Include ai_emotions if present
            if (data.ai_emotions || data.aiEmotions) {
                mapped.ai_emotions = data.ai_emotions || data.aiEmotions || [];
            }
            return mapped;
        } catch (e) {
            console.error("Failed to get movie details", e);
            return null;
        }
    },
    searchByGenres: async (genres, page = 0, size = 20) => {
        try {
            const response = await movieService.searchByGenres(genres, page, size);
            const movies = (response.movies || []).map(mapOmdbToFrontend);
            return { movies, totalHits: response.totalHits || 0, page: response.page, size: response.size };
        } catch (e) {
            console.error("Failed to search by genres", e);
            return { movies: [], totalHits: 0, page, size };
        }
    },
    getByEmotion: async (emotion) => {
        try {
            const results = await movieService.getByEmotion(emotion);
            if (Array.isArray(results)) {
                return results.map(mapOmdbToFrontend);
            }
            return [];
        } catch (e) {
            console.error("Failed to get by emotion", e);
            return [];
        }
    },
    getByEmotions: async (emotions) => {
        try {
            const results = await movieService.getByEmotions(emotions);
            if (Array.isArray(results)) {
                return results.map(mapOmdbToFrontend);
            }
            return [];
        } catch (e) {
            console.error("Failed to get by emotions", e);
            return [];
        }
    },
    filter: async (genres, emotions, page = 0, size = 20, awarded = false) => {
        try {
            const response = await movieService.filter(genres, emotions, page, size, awarded);
            const movies = (response.movies || []).map(mapOmdbToFrontend);
            return { movies, totalHits: response.totalHits || 0, page: response.page, size: response.size };
        } catch (e) {
            console.error("Failed to filter movies", e);
            return { movies: [], totalHits: 0, page, size };
        }
    },
    get: async (id) => {
        return movieService.getDetails(id);
    },
    getRandom: async () => {
        try {
            const data = await movieService.getRandom();
            return data ? mapOmdbToFrontend(data) : null;
        } catch (e) {
            console.error("Failed to get random movie", e);
            return null;
        }
    }
};
