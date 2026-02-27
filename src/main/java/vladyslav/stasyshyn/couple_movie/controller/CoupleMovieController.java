package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vladyslav.stasyshyn.couple_movie.model.User;
import vladyslav.stasyshyn.couple_movie.service.CoupleMovieService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/couple/movies")
@RequiredArgsConstructor
public class CoupleMovieController {

    private final CoupleMovieService coupleMovieService;

    @GetMapping
    public ResponseEntity<?> getSharedMovies(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(coupleMovieService.getSharedMovies(user));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> addMovie(@AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(coupleMovieService.addMovie(user, body));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{imdbId}")
    @Transactional
    public ResponseEntity<?> removeMovie(@AuthenticationPrincipal User user,
            @PathVariable String imdbId) {
        try {
            coupleMovieService.removeMovie(user, imdbId);
            return ResponseEntity.ok(Map.of("message", "Removed from shared favorites"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{imdbId}")
    public ResponseEntity<?> updateStatus(@AuthenticationPrincipal User user,
            @PathVariable String imdbId,
            @RequestBody Map<String, String> body) {
        try {
            String watchStatus = body.getOrDefault("watch_status", "WATCHLIST");
            return ResponseEntity.ok(coupleMovieService.updateMovieStatus(user, imdbId, watchStatus));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{imdbId}/rate")
    public ResponseEntity<?> rateMovie(@AuthenticationPrincipal User user,
            @PathVariable String imdbId,
            @RequestBody Map<String, Object> body) {
        try {
            Object ratingObj = body.get("rating");
            if (ratingObj == null) {
                return ResponseEntity.badRequest().body("rating is required");
            }
            double rating = ratingObj instanceof Number ? ((Number) ratingObj).doubleValue()
                    : Double.parseDouble(ratingObj.toString());
            return ResponseEntity.ok(coupleMovieService.rateMovie(user, imdbId, rating));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(coupleMovieService.getStats(user));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/check/{imdbId}")
    public ResponseEntity<?> checkMovie(@AuthenticationPrincipal User user, @PathVariable String imdbId) {
        try {
            return ResponseEntity.ok(coupleMovieService.checkMovie(user, imdbId));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
