import { movieService } from '../services/movieService';

/**
 * Maps OMDb API response fields (capitalized via @JsonProperty) to the
 * frontend's camelCase/snake_case format used by MovieCard and MovieDetails.
 */
const mapOmdbToFrontend = (m) => ({
    id: m.imdbID || m.imdbid,
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
            const response = await movieService.search(title);
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
    getDetails: async (imdbId) => {
        try {
            const data = await movieService.getDetails(imdbId);
            return mapOmdbToFrontend(data);
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
    get: async (id) => {
        return movieService.getDetails(id);
    }
};
