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

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

    private final OmdbService omdbService;
    private final MovieSearchService movieSearchService;

    @GetMapping("/search")
    public ResponseEntity<?> searchMovies(@RequestParam("title") String title) {
        return ResponseEntity.ok(omdbService.searchMovies(title));
    }

    @GetMapping("/advanced-search")
    public ResponseEntity<?> advancedSearch(@RequestParam("query") String query) {
        return ResponseEntity.ok(movieSearchService.searchMovies(query));
    }

    @GetMapping("/{imdbId}")
    public ResponseEntity<?> getMovieDetails(@PathVariable("imdbId") String imdbId) {
        var cachedMovie = movieSearchService.getMovieById(imdbId);
        if (cachedMovie.isPresent()) {
            return ResponseEntity.ok(cachedMovie.get());
        }
        return ResponseEntity.ok(omdbService.getMovieDetails(imdbId));
    }
}
