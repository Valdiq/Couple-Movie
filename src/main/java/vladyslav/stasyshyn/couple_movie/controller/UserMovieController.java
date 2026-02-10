package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vladyslav.stasyshyn.couple_movie.dto.RateMovieRequest;
import vladyslav.stasyshyn.couple_movie.model.MovieStatus;
import vladyslav.stasyshyn.couple_movie.model.User;
import vladyslav.stasyshyn.couple_movie.service.UserMovieService;

@RestController
@RequestMapping("/api/user/movies")
@RequiredArgsConstructor
public class UserMovieController {

    private final UserMovieService userMovieService;

    @PostMapping("/{imdbId}/status")
    public ResponseEntity<?> updateStatus(@AuthenticationPrincipal User user,
            @PathVariable("imdbId") String imdbId,
            @RequestParam("status") MovieStatus status) {
        return ResponseEntity.ok(userMovieService.updateStatus(user, imdbId, status));
    }

    @PostMapping("/{imdbId}/rate")
    public ResponseEntity<?> rateMovie(@AuthenticationPrincipal User user,
            @PathVariable("imdbId") String imdbId,
            @RequestBody RateMovieRequest request) {
        try {
            return ResponseEntity
                    .ok(userMovieService.rateMovie(user, imdbId, request.getRating(), request.getReview()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/watchlist")
    public ResponseEntity<?> getWatchlist(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userMovieService.getWatchlist(user));
    }

    @GetMapping("/shared-watchlist")
    public ResponseEntity<?> getSharedWatchlist(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(userMovieService.getSharedWatchlist(user));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
