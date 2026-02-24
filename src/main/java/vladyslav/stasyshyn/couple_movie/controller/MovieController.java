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
import vladyslav.stasyshyn.couple_movie.service.EmotionGenreService;
import vladyslav.stasyshyn.couple_movie.service.MovieSearchService;
import vladyslav.stasyshyn.couple_movie.service.OmdbService;

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

    /**
     * Search for movies by title using the external OMDb API.
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchMovies(@RequestParam("title") String title) {
        return ResponseEntity.ok(omdbService.searchMovies(title));
    }

    /**
     * Search for ALL movies matching a title (multi-page OMDb fetch).
     */
    @GetMapping("/search-all")
    public ResponseEntity<?> searchAllMovies(@RequestParam("title") String title) {
        return ResponseEntity.ok(omdbService.searchAllMovies(title));
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
     */
    @GetMapping("/by-genres")
    public ResponseEntity<?> getMoviesByGenres(@RequestParam("genres") List<String> genres) {
        try {
            return ResponseEntity.ok(movieSearchService.searchByGenres(genres));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Get movies matching an emotion.
     * "nostalgic" is special-cased: returns movies with rating > 9 and at least 10
     * years old.
     */
    @GetMapping("/by-emotion")
    public ResponseEntity<?> getMoviesByEmotion(@RequestParam("emotion") String emotion) {
        if ("nostalgic".equalsIgnoreCase(emotion)) {
            try {
                return ResponseEntity.ok(movieSearchService.searchNostalgic());
            } catch (Exception e) {
                return ResponseEntity.ok(List.of());
            }
        }
        List<String> genres = emotionGenreService.getGenresForEmotion(emotion);
        if (genres.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        try {
            return ResponseEntity.ok(movieSearchService.searchByGenres(genres));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Get movies matching multiple emotions.
     * Collects all mapped genres from all emotions, deduplicates, and searches.
     * "nostalgic" is handled specially — its results are merged in.
     */
    @GetMapping("/by-emotions")
    public ResponseEntity<?> getMoviesByEmotions(@RequestParam("emotions") List<String> emotions) {
        try {
            Set<String> allGenres = new LinkedHashSet<>();
            boolean includeNostalgic = false;

            for (String emotion : emotions) {
                if ("nostalgic".equalsIgnoreCase(emotion.trim())) {
                    includeNostalgic = true;
                    continue;
                }
                List<String> genres = emotionGenreService.getGenresForEmotion(emotion.trim());
                allGenres.addAll(genres);
            }

            Map<String, Object> seenIds = new LinkedHashMap<>();

            if (!allGenres.isEmpty()) {
                var genreResults = movieSearchService.searchByGenres(new ArrayList<>(allGenres));
                for (var movie : genreResults) {
                    seenIds.putIfAbsent(movie.getImdbID(), movie);
                }
            }

            if (includeNostalgic) {
                var nostalgicResults = movieSearchService.searchNostalgic();
                for (var movie : nostalgicResults) {
                    seenIds.putIfAbsent(movie.getImdbID(), movie);
                }
            }

            return ResponseEntity.ok(new ArrayList<>(seenIds.values()));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Get detailed information about a specific movie.
     */
    @GetMapping("/{imdbId}")
    public ResponseEntity<?> getMovieDetails(@PathVariable("imdbId") String imdbId) {
        var cachedMovie = movieSearchService.getMovieById(imdbId);
        if (cachedMovie.isPresent()) {
            return ResponseEntity.ok(cachedMovie.get());
        }
        return ResponseEntity.ok(omdbService.getMovieDetails(imdbId));
    }

    /**
     * Batch fetch ratings from Elasticsearch cache for a list of IMDb IDs.
     */
    @PostMapping("/batch-ratings")
    public ResponseEntity<?> batchRatings(@RequestBody Map<String, List<String>> body) {
        List<String> ids = body.getOrDefault("ids", List.of());
        Map<String, Object> ratings = new LinkedHashMap<>();
        for (String id : ids) {
            movieSearchService.getMovieById(id).ifPresent(doc -> {
                ratings.put(id, doc.getImdbRating());
            });
        }
        return ResponseEntity.ok(ratings);
    }
}
