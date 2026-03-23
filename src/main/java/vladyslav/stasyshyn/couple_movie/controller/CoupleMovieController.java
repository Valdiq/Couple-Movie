package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vladyslav.stasyshyn.couple_movie.dto.CoupleMovieResponse;
import vladyslav.stasyshyn.couple_movie.dto.GetStatusResponse;
import vladyslav.stasyshyn.couple_movie.dto.AddMovieResponse;
import vladyslav.stasyshyn.couple_movie.dto.UpdateMovieStatusResponse;
import vladyslav.stasyshyn.couple_movie.dto.RateMovieResponse;
import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.exception.UnauthorizedException;
import vladyslav.stasyshyn.couple_movie.service.CoupleMovieService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/couple/movies")
@RequiredArgsConstructor
public class CoupleMovieController {

    private final CoupleMovieService coupleMovieService;

    @GetMapping
    public ResponseEntity<List<CoupleMovieResponse>> getSharedMovies(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(coupleMovieService.getSharedMovies(user));
    }

    @GetMapping("/my-ids")
    public ResponseEntity<List<String>> getMyAddedMovieIds(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(coupleMovieService.getMyAddedMovieIds(user));
    }

    @PostMapping
    public ResponseEntity<AddMovieResponse> addMovie(@AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(coupleMovieService.addMovie(user, body));
    }

    @DeleteMapping("/{imdbId}")
    public ResponseEntity<Map<String, Object>> removeMovie(@AuthenticationPrincipal User user, @PathVariable String imdbId) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        coupleMovieService.removeMovie(user, imdbId);
        return ResponseEntity.ok(Map.of("message", "Removed from shared favorites"));
    }

    @PatchMapping("/{imdbId}")
    public ResponseEntity<UpdateMovieStatusResponse> updateStatus(@AuthenticationPrincipal User user,
            @PathVariable String imdbId, @RequestBody Map<String, Object> body) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(coupleMovieService.updateMovieStatus(user, imdbId, body));
    }

    @PostMapping("/{imdbId}/rate")
    public ResponseEntity<RateMovieResponse> rateMovie(@AuthenticationPrincipal User user, @PathVariable String imdbId,
            @RequestBody Map<String, Object> body) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(coupleMovieService.rateMovie(user, imdbId, body));
    }

    @GetMapping("/stats")
    public ResponseEntity<GetStatusResponse> getStats(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(coupleMovieService.getStats(user));
    }

    @GetMapping("/check/{imdbId}")
    public ResponseEntity<Boolean> isAddedByUser(@AuthenticationPrincipal User user, @PathVariable String imdbId) {
        if (user == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return ResponseEntity.ok(coupleMovieService.isAddedByUser(user, imdbId));
    }
}
