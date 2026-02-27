import { movieService } from '../services/movieService';

/**
 * Maps OMDb API response fields (capitalized via @JsonProperty) to the
 * frontend's camelCase/snake_case format used by MovieCard and MovieDetails.
 */
const mapOmdbToFrontend = (m) => ({
    id: m.imdbID || m.imdbid || m.imdbId,
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
    rated: m.Rated || m.rated,
    runtime: m.Runtime || m.runtime,
    imdb_rating: m.imdbRating || m.imdbrating,
    imdb_votes: m.imdbVotes || m.imdbvotes,
    metascore: m.Metascore || m.metascore,
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
                return searchResults.map(m => ({
                    id: m.imdbID || m.imdbid,
                    title: m.Title || m.title,
                    poster: m.Poster || m.poster,
                    year: m.Year || m.year,
                    type: m.Type || m.type,
                }));
            }
            return [];
        } catch (e) {
            console.error("Failed to search movies", e);
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
    searchByGenres: async (genres) => {
        try {
            const results = await movieService.searchByGenres(genres);
            if (Array.isArray(results)) {
                return results.map(m => ({
                    id: m.imdbID,
                    title: m.title,
                    poster: m.poster,
                    year: m.year,
                    type: m.type,
                    genre: m.genre,
                    director: m.director,
                    plot: m.plot,
                    imdb_rating: m.imdbRating,
                }));
            }
            return [];
        } catch (e) {
            console.error("Failed to search by genres", e);
            return [];
        }
    },
    getByEmotion: async (emotion) => {
        try {
            const results = await movieService.getByEmotion(emotion);
            if (Array.isArray(results)) {
                return results.map(m => ({
                    id: m.imdbID,
                    title: m.title,
                    poster: m.poster,
                    year: m.year,
                    type: m.type,
                    genre: m.genre,
                    director: m.director,
                    plot: m.plot,
                    imdb_rating: m.imdbRating,
                }));
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
                return results.map(m => ({
                    id: m.imdbID,
                    title: m.title,
                    poster: m.poster,
                    year: m.year,
                    type: m.type,
                    genre: m.genre,
                    director: m.director,
                    plot: m.plot,
                    imdb_rating: m.imdbRating,
                }));
            }
            return [];
        } catch (e) {
            console.error("Failed to get by emotions", e);
            return [];
        }
    },
    filter: async (genres, emotions) => {
        try {
            const results = await movieService.filter(genres, emotions);
            if (Array.isArray(results)) {
                return results.map(m => ({
                    id: m.imdbID,
                    title: m.title,
                    poster: m.poster,
                    year: m.year,
                    type: m.type,
                    genre: m.genre,
                    director: m.director,
                    plot: m.plot,
                    imdb_rating: m.imdbRating,
                }));
            }
            return [];
        } catch (e) {
            console.error("Failed to filter movies", e);
            return [];
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
