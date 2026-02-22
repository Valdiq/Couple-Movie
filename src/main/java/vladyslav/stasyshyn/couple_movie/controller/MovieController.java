package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vladyslav.stasyshyn.couple_movie.service.EmotionGenreService;
import vladyslav.stasyshyn.couple_movie.service.MovieSearchService;
import vladyslav.stasyshyn.couple_movie.service.OmdbService;

import java.util.List;

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

    /**
     * Search for movies by title using the external OMDb API.
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchMovies(@RequestParam("title") String title) {
        return ResponseEntity.ok(omdbService.searchMovies(title));
    }

    /**
     * Advanced search using Elasticsearch for cached movies.
     */
    @GetMapping("/advanced-search")
    public ResponseEntity<?> advancedSearch(@RequestParam("query") String query) {
        return ResponseEntity.ok(movieSearchService.searchMovies(query));
    }

    /**
     * Search movies in Elasticsearch cache by one or more genres.
     *
     * @param genres Comma-separated list of genre names (e.g., "Comedy,Action").
     */
    @GetMapping("/by-genres")
    public ResponseEntity<?> getMoviesByGenres(@RequestParam("genres") List<String> genres) {
        try {
            return ResponseEntity.ok(movieSearchService.searchByGenres(genres));
        } catch (Exception e) {
            // Elasticsearch may be unavailable or have no data
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Get movies matching an emotion.
     * Maps the emotion to genres, then searches cached movies by those genres.
     *
     * @param emotion The emotion name (e.g., "happy", "romantic").
     */
    @GetMapping("/by-emotion")
    public ResponseEntity<?> getMoviesByEmotion(@RequestParam("emotion") String emotion) {
        List<String> genres = emotionGenreService.getGenresForEmotion(emotion);
        if (genres.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        try {
            return ResponseEntity.ok(movieSearchService.searchByGenres(genres));
        } catch (Exception e) {
            // Elasticsearch may be unavailable or have no data
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Get detailed information about a specific movie.
     * Tries to fetch from local cache first, then falls back to OMDb API.
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
