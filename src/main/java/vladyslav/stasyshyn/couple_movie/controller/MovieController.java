package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbMovieDetails;
import vladyslav.stasyshyn.couple_movie.dto.omdb.OmdbSearchResponse;
import vladyslav.stasyshyn.couple_movie.service.OmdbService;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

    private final OmdbService omdbService;

    @GetMapping("/search")
    public ResponseEntity<OmdbSearchResponse> searchMovies(@RequestParam("title") String title) {
        return ResponseEntity.ok(omdbService.searchMovies(title));
    }

    @GetMapping("/{imdbId}")
    public ResponseEntity<OmdbMovieDetails> getMovieDetails(@PathVariable("imdbId") String imdbId) {
        return ResponseEntity.ok(omdbService.getMovieDetails(imdbId));
    }
}
