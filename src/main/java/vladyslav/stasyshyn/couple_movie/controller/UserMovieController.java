package vladyslav.stasyshyn.couple_movie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vladyslav.stasyshyn.couple_movie.dto.RateMovieRequest;
import vladyslav.stasyshyn.couple_movie.model.MovieStatus;
import vladyslav.stasyshyn.couple_movie.model.User;
import vladyslav.stasyshyn.couple_movie.service.UserMovieService;

/**
 * Controller for managing user-specific movie interactions such as
 * watchlistStatus and ratings.
 */
@RestController
@RequestMapping("/api/user/movies")
@RequiredArgsConstructor
public class UserMovieController {

    private final UserMovieService userMovieService;

    /**
     * Updates the status of a movie for the authenticated user (e.g., WATCHED,
     * WATCHLIST).
     *
     * @param user   The authenticated user.
     * @param imdbId The IMDb ID of the movie.
     * @param status The new status to set.
     * @return The updated UserMovieStatus.
     */
    @PostMapping("/{imdbId}/status")
    public ResponseEntity<?> updateStatus(@AuthenticationPrincipal User user,
            @PathVariable("imdbId") String imdbId,
            @RequestParam("status") MovieStatus status) {
        try {
            return ResponseEntity.ok(userMovieService.updateStatus(user, imdbId, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating status: " + e.getMessage());
        }
    }

    /**
     * Rates a movie for the authenticated user.
     *
     * @param user    The authenticated user.
     * @param imdbId  The IMDb ID of the movie.
     * @param request The rating request containing rating value and optional
     *                review.
     * @return The updated UserMovieStatus.
     */
    @PostMapping("/{imdbId}/rate")
    public ResponseEntity<?> rateMovie(@AuthenticationPrincipal User user,
            @PathVariable("imdbId") String imdbId,
            @RequestBody RateMovieRequest request) {
        try {
            return ResponseEntity
                    .ok(userMovieService.rateMovie(user, imdbId, request.getRating(), request.getReview()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An unexpected error occurred while rating the movie.");
        }
    }

    /**
     * Retrieves the authenticated user's watchlist.
     *
     * @param user The authenticated user.
     * @return A list of movies in the user's watchlist.
     */
    @GetMapping("/watchlist")
    public ResponseEntity<?> getWatchlist(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(userMovieService.getWatchlist(user));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving watchlist: " + e.getMessage());
        }
    }

    /**
     * Retrieves the shared watchlist for the authenticated user and their partner.
     *
     * @param user The authenticated user.
     * @return A list of shared movies.
     */
    @GetMapping("/shared-watchlist")
    public ResponseEntity<?> getSharedWatchlist(@AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(userMovieService.getSharedWatchlist(user));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving shared watchlist: " + e.getMessage());
        }
    }
}
