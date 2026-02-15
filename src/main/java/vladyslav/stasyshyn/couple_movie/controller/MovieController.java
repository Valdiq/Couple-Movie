package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vladyslav.stasyshyn.couple_movie.service.MovieSearchService;
import vladyslav.stasyshyn.couple_movie.service.OmdbService;

/**
 * Controller for public movie search and details retrieval.
 */
@RestController
@RequestMapping("/api/v1/movies")
@RequiredArgsConstructor
public class MovieController {

    private final OmdbService omdbService;
    private final MovieSearchService movieSearchService;

    /**
     * Search for movies by title using the external OMDb API.
     *
     * @param title The title to search for.
     * @return A list of search results.
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchMovies(@RequestParam("title") String title) {
        return ResponseEntity.ok(omdbService.searchMovies(title));
    }

    /**
     * Advanced search using Elasticsearch for cached movies.
     *
     * @param query The search query string.
     * @return A list of matching movies from local cache.
     */
    @GetMapping("/advanced-search")
    public ResponseEntity<?> advancedSearch(@RequestParam("query") String query) {
        return ResponseEntity.ok(movieSearchService.searchMovies(query));
    }

    /**
     * Get detailed information about a specific movie.
     * Tries to fetch from local cache first, then falls back to OMDb API.
     *
     * @param imdbId The IMDb ID of the movie.
     * @return The movie details.
     */
    @GetMapping("/{imdbId}")
    public ResponseEntity<?> getMovieDetails(@PathVariable("imdbId") String imdbId) {
        var cachedMovie = movieSearchService.getMovieById(imdbId);
        if (cachedMovie.isPresent()) {
            return ResponseEntity.ok(cachedMovie.get());
        }
        return ResponseEntity.ok(omdbService.getMovieDetails(imdbId));
    }
}
