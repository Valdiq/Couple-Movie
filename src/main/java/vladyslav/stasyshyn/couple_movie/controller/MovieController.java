package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vladyslav.stasyshyn.couple_movie.dto.SearchPageResponse;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbSearchResponse;
import vladyslav.stasyshyn.couple_movie.entity.Movie;
import vladyslav.stasyshyn.couple_movie.service.EmotionGenreService;
import vladyslav.stasyshyn.couple_movie.service.MovieSearchService;
import vladyslav.stasyshyn.couple_movie.service.OmdbService;
import vladyslav.stasyshyn.couple_movie.service.TmdbService;
import java.util.*;

/**
 * Controller for public movie search and details retrieval.
 */
@RestController
@RequestMapping("/api/v1/movies")
@RequiredArgsConstructor
public class MovieController {

    private final OmdbService omdbService;
    private final MovieSearchService movieSearchService;
    private final EmotionGenreService emotionGenreService;
    private final TmdbService tmdbService;

    /**
     * Search for movies by title using the external OMDb API.
     */
    @GetMapping("/search")
    public ResponseEntity<OmdbSearchResponse> searchMovies(@RequestParam("title") String title) {
        return ResponseEntity.ok(omdbService.searchMovies(title));
    }

    /**
     * Search for ALL movies matching a title (multi-page OMDb fetch).
     */
    @GetMapping("/search-all")
    public ResponseEntity<OmdbSearchResponse> searchAllMovies(@RequestParam("title") String title) {
        return ResponseEntity.ok(omdbService.searchAllMovies(title));
    }

    /**
     * Get live trending movies/series from TMDB, populated via OMDb cache/DB.
     */
    @GetMapping("/trending")
    public ResponseEntity<List<Movie>> getTrending() {
        return ResponseEntity.ok(tmdbService.getTrending());
    }

    /**
     * Advanced search using Elasticsearch for cached movies.
     */
    @GetMapping("/advanced-search")
    public ResponseEntity<SearchPageResponse> advancedSearch(
            @RequestParam("query") String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(movieSearchService.searchMovies(query, page, size));
    }

    /**
     * Autocomplete suggestions using Elasticsearch for cached movies.
     */
    @GetMapping("/autocomplete")
    public ResponseEntity<List<Movie>> autocomplete(@RequestParam("query") String query,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        return ResponseEntity.ok(movieSearchService.autocomplete(query, limit));
    }

    /**
     * Search movies in Elasticsearch cache by one or more genres.
     */
    @GetMapping("/by-genres")
    public ResponseEntity<SearchPageResponse> getMoviesByGenres(
            @RequestParam("genres") List<String> genres,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(movieSearchService.searchByGenres(genres, page, size));
    }

    /**
     * Get movies matching an emotion.
     * "nostalgic" is special-cased: returns movies with rating > 9 and at least 10
     * years old.
     */
    @GetMapping("/by-emotion")
    public ResponseEntity<List<Movie>> getMoviesByEmotion(@RequestParam("emotion") String emotion) {
        if (emotion.equalsIgnoreCase("nostalgic")) {
            return ResponseEntity.ok(movieSearchService.searchNostalgic());
        }
        return ResponseEntity.ok(movieSearchService.searchByGenres(emotionGenreService.getGenresForEmotion(emotion)));
    }

    /**
     * Get movies matching multiple emotions.
     * Collects all mapped genres from all emotions, deduplicates, and searches.
     * "nostalgic" is handled specially — its results are merged in.
     */
    @GetMapping("/by-emotions")
    public ResponseEntity<SearchPageResponse> getMoviesByEmotions(
            @RequestParam("emotions") List<String> emotions,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(movieSearchService.filterMoviesAndEmotions(null, emotions, emotionGenreService, page, size, false));
    }

    /**
     * Filter movies combining genres and emotions.
     */
    @GetMapping("/filter")
    public ResponseEntity<SearchPageResponse> filterMovies(
            @RequestParam(value = "genres", required = false) List<String> genres,
            @RequestParam(value = "emotions", required = false) List<String> emotions,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "15") int size,
            @RequestParam(value = "awarded", defaultValue = "false") boolean awarded) {
        return ResponseEntity.ok(movieSearchService.filterMoviesAndEmotions(genres, emotions, emotionGenreService, page, size, awarded));
    }

    /**
     * Get detailed information about a specific movie.
     */
    @GetMapping("/{imdbId}")
    public ResponseEntity<Object> getMovieDetails(@PathVariable("imdbId") String imdbId) {
        return ResponseEntity.ok(movieSearchService.getMovieDetails(imdbId, omdbService));
    }

    /**
     * Get a random movie from the database (Surprise Me feature).
     */
    @GetMapping("/random")
    public ResponseEntity<Movie> getRandomMovie() {
        var movie = movieSearchService.getRandomMovie();
        if (movie != null) {
            return ResponseEntity.ok(movie);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Batch fetch ratings from Elasticsearch cache for a list of IMDb IDs.
     */
    @PostMapping("/batch-ratings")
    public ResponseEntity<Map<String, Double>> batchRatings(@RequestBody Map<String, List<String>> body) {
        return ResponseEntity.ok(movieSearchService.getBatchRatings(body));
    }
}
